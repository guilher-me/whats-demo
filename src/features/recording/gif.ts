import { GIFEncoder, nearestColorIndex, quantize } from 'gifenc';
import type { RecordedClip } from './types';

const FRAME_INTERVAL_CS = 8;
const MAX_FRAMES = 900;
const PALETTE_SAMPLE_FRAMES = 12;
const PALETTE_SAMPLE_STRIDE = 16;
const MAX_CACHED_COLORS = 65_536;
const TRANSPARENCY_THRESHOLD = 128;

function decodeFrame(
  video: HTMLVideoElement,
  event: 'loadeddata' | 'seeked',
  start: () => void,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const cleanUp = () => {
      clearTimeout(timer);
      video.removeEventListener(event, ready);
      video.removeEventListener('error', failed);
      signal.removeEventListener('abort', cancelled);
    };
    const ready = () => {
      cleanUp();
      resolve();
    };
    const failed = () => {
      cleanUp();
      reject(new Error('Could not decode the recording frame'));
    };
    const cancelled = () => {
      cleanUp();
      reject(signal.reason);
    };
    const timer = setTimeout(failed, 10_000);
    video.addEventListener(event, ready);
    video.addEventListener('error', failed);
    signal.addEventListener('abort', cancelled);
    try {
      start();
    } catch (error) {
      cleanUp();
      reject(error);
    }
  });
}

export async function createRecordingGif(
  clip: RecordedClip,
  signal: AbortSignal,
  onProgress: (percent: number) => void,
): Promise<Blob> {
  signal.throwIfAborted();
  const video = document.createElement('video');
  video.preload = 'auto';
  const url = URL.createObjectURL(clip.blob);
  try {
    await decodeFrame(video, 'loadeddata', () => (video.src = url), signal);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 360 / video.videoWidth, 720 / video.videoHeight);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const { width, height } = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || !width || !height) throw new Error('Could not sample the recording');

    const duration = Number.isFinite(video.duration) ? video.duration : clip.durationMs / 1000;
    // Distribute delays in GIF centiseconds so capped frame counts still preserve the clip length.
    const durationCs = Math.max(2, Math.round(duration * 100));
    const frames = Math.min(MAX_FRAMES, Math.max(1, Math.floor(durationCs / FRAME_INTERVAL_CS)));
    const frameStart = (frame: number) => Math.round((frame * durationCs) / frames);
    const readFrame = async (frame: number) => {
      signal.throwIfAborted();
      const start = frameStart(frame) / 100;
      const timestamp =
        frame > 0 && frame === frames - 1 ? Math.max(start, duration - 0.04) : start;
      if (timestamp !== video.currentTime) {
        await decodeFrame(video, 'seeked', () => (video.currentTime = timestamp), signal);
      }
      context.clearRect(0, 0, width, height);
      context.drawImage(video, 0, 0, width, height);
      return context.getImageData(0, 0, width, height).data;
    };

    // Sample across the clip to keep a single palette even when new content appears later.
    const sampleFrames = Math.min(frames, PALETTE_SAMPLE_FRAMES);
    const pixelsPerFrame = width * height;
    const samples = new Uint32Array(
      Math.ceil(pixelsPerFrame / PALETTE_SAMPLE_STRIDE) * sampleFrames,
    );
    let sampled = 0;
    for (let sample = 0; sample < sampleFrames; sample++) {
      const frame = Math.round((sample * (frames - 1)) / Math.max(1, sampleFrames - 1));
      const data = await readFrame(frame);
      const colors = new Uint32Array(data.buffer, data.byteOffset, pixelsPerFrame);
      for (let pixel = sample; pixel < pixelsPerFrame; pixel += PALETTE_SAMPLE_STRIDE) {
        if (!clip.transparent || data[pixel * 4 + 3] >= TRANSPARENCY_THRESHOLD) {
          samples[sampled++] = colors[pixel];
        }
      }
      onProgress(Math.round(((sample + 1) * 15) / sampleFrames));
    }
    const palette = sampled
      ? quantize(
          new Uint8ClampedArray(samples.buffer, 0, sampled * 4),
          clip.transparent ? 255 : 256,
        )
      : [[0, 0, 0]];
    if (clip.transparent) palette.unshift([0, 0, 0]);

    const encoder = GIFEncoder();
    const indices = new Uint8Array(pixelsPerFrame);
    const colorCache = new Map<number, number>();
    const opaqueColors = clip.transparent ? palette.slice(1) : palette;
    const firstOpaqueIndex = clip.transparent ? 1 : 0;
    for (let frame = 0; frame < frames; frame++) {
      const data = await readFrame(frame);
      for (let pixel = 0; pixel < indices.length; pixel++) {
        const offset = pixel * 4;
        if (clip.transparent && data[offset + 3] < TRANSPARENCY_THRESHOLD) {
          indices[pixel] = 0;
          continue;
        }
        const red = data[offset];
        const green = data[offset + 1];
        const blue = data[offset + 2];
        // Cache exact RGB values so palette indices never depend on pixel order in a frame.
        const color = (red << 16) | (green << 8) | blue;
        let index = colorCache.get(color);
        if (index === undefined) {
          index = firstOpaqueIndex + nearestColorIndex(opaqueColors, [red, green, blue]);
          if (colorCache.size < MAX_CACHED_COLORS) colorCache.set(color, index);
        }
        indices[pixel] = index;
      }
      encoder.writeFrame(indices, width, height, {
        palette: frame === 0 ? palette : undefined,
        delay: (frameStart(frame + 1) - frameStart(frame)) * 10,
        transparent: clip.transparent,
      });
      onProgress(15 + Math.round(((frame + 1) * 85) / frames));
    }
    encoder.finish();
    return new Blob([encoder.bytes()], { type: 'image/gif' });
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
