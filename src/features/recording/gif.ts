import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import type { RecordedClip } from './types';

const FRAME_INTERVAL_CS = 8;
const MAX_FRAMES = 900;

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
    const encoder = GIFEncoder();
    for (let frame = 0; frame < frames; frame++) {
      signal.throwIfAborted();
      const startCs = Math.round((frame * durationCs) / frames);
      const endCs = Math.round(((frame + 1) * durationCs) / frames);
      const timestamp =
        frame > 0 && frame === frames - 1
          ? Math.max(startCs / 100, duration - 0.04)
          : startCs / 100;
      if (timestamp !== video.currentTime) {
        await decodeFrame(video, 'seeked', () => (video.currentTime = timestamp), signal);
      }
      context.clearRect(0, 0, width, height);
      context.drawImage(video, 0, 0, width, height);
      const { data } = context.getImageData(0, 0, width, height);
      const palette = quantize(data, clip.transparent ? 255 : 256);
      const pixels = applyPalette(data, palette);
      if (clip.transparent) {
        // GIF uses a single transparent palette entry. Keep opaque colors at indices 1 and up.
        palette.unshift([0, 0, 0]);
        for (let pixel = 0; pixel < pixels.length; pixel++) {
          pixels[pixel] = data[pixel * 4 + 3] < 128 ? 0 : pixels[pixel] + 1;
        }
      }
      encoder.writeFrame(pixels, width, height, {
        palette,
        delay: (endCs - startCs) * 10,
        transparent: clip.transparent,
      });
      onProgress(Math.round(((frame + 1) * 100) / frames));
    }
    encoder.finish();
    return new Blob([encoder.bytes()], { type: 'image/gif' });
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
