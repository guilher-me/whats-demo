import { t } from '../../i18n';
import fixWebmDuration from 'fix-webm-duration';
import { delay } from '../../core/async';
import { hasTransparentCorners } from './alpha';
import { capturePhone } from './capture';
import { paintRecordingCursor, readRecordingCursor } from './cursor';
import type { PhoneRecording, RecordedClip } from './types';

// Constrained Baseline, level 4.0 accommodates the 720 × 1440 capture.
const MP4_FORMATS = ['video/mp4;codecs=avc1.42E028', 'video/mp4;codecs=avc1'];
const ALPHA_FORMAT = 'video/webm;codecs=vp8';
const FRAME_INTERVAL = 1000 / 30;
const SNAPSHOT_INTERVAL = 1000 / 15;
const FINAL_FRAME_HOLD = 400;
const visualEvents = ['input', 'change', 'scroll', 'focusin', 'focusout'];

export function recordingSupport(): string {
  if (
    typeof MediaRecorder === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined' ||
    typeof HTMLCanvasElement.prototype.captureStream !== 'function'
  )
    return t('errors.recordUnsupported');
  return '';
}
export function supportsTransparentRecording(): boolean {
  return !recordingSupport() && MediaRecorder.isTypeSupported(ALPHA_FORMAT);
}

export function recordingMimeTypes(transparent = false): string[] {
  const candidates = transparent
    ? [ALPHA_FORMAT]
    : [...MP4_FORMATS, 'video/webm;codecs=vp9', ALPHA_FORMAT, 'video/webm'];
  return candidates.filter((type) => MediaRecorder.isTypeSupported(type));
}

export async function preparePhoneRecording(
  node: HTMLElement,
  onError: (error: Error) => void,
  transparent = false,
): Promise<PhoneRecording> {
  const unsupported = recordingSupport();
  if (unsupported) throw new Error(unsupported);
  const formats = recordingMimeTypes(transparent);
  const formatError = t(transparent ? 'errors.recordTransparency' : 'errors.videoFormat');
  if (!formats.length) throw new Error(formatError);
  const width = node.offsetWidth,
    height = node.offsetHeight;
  if (!width || !height) throw new Error(t('errors.phoneVisible'));
  const backdrop = transparent
    ? 'transparent'
    : getComputedStyle(node).getPropertyValue('--recording-backdrop').trim() || '#fff';
  let frame = await capturePhone(node, width, height, backdrop);
  const cursor = node.querySelector<HTMLElement>('[data-recording-cursor]');
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(t('errors.prepareImage'));
  const paint = () => {
    if (transparent) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      context.fillStyle = backdrop;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(frame, 0, 0, canvas.width, canvas.height);
  };
  paint();
  // Detect a tainted canvas before starting a countdown or accumulating a video.
  context.getImageData(0, 0, 1, 1);
  const stream = canvas.captureStream();
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
  let cursorFrame: ReturnType<typeof readRecordingCursor> = null;
  let holdFinalFrame = false;
  const publishFrame = () => {
    track?.requestFrame?.();
    paint();
    if (!holdFinalFrame) cursorFrame = readRecordingCursor(node, cursor);
    if (cursorFrame) paintRecordingCursor(context, cursorFrame);
  };
  let media: MediaRecorder | undefined;
  for (const mimeType of formats) {
    try {
      const webm = mimeType.startsWith('video/webm');
      media = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: webm ? 5_000_000 : 2_500_000,
        ...(webm && { videoKeyFrameIntervalDuration: 1000 }),
      });
      break;
    } catch {
      /* Try the next native encoder. */
    }
  }
  if (!media) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error(formatError);
  }
  const recorder = media;
  const chunks: Blob[] = [];
  let snapshotTimer: ReturnType<typeof setTimeout> | undefined,
    frameTimer: ReturnType<typeof setInterval> | undefined,
    changed = true,
    animating = false,
    ended = false,
    discarded = false,
    startedAt: number | undefined,
    durationMs = 0;
  let inFlight: Promise<void> = Promise.resolve();
  let resolve!: (clip: RecordedClip) => void, reject!: (error: Error) => void;
  const result = new Promise<RecordedClip>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  void result.catch(() => {});
  const invalidate = () => {
    changed = true;
  };
  const observer = new MutationObserver((records) => {
    // React can rewrite an input's name during an update that leaves its appearance unchanged.
    if (
      records.some(
        ({ target, attributeName }) =>
          target !== cursor && !(target instanceof HTMLInputElement && attributeName === 'name'),
      )
    )
      invalidate();
  });
  const finalFrame = new AbortController();
  const release = () => {
    clearTimeout(snapshotTimer);
    clearInterval(frameTimer);
    observer.disconnect();
    finalFrame.abort();
    for (const event of visualEvents) node.removeEventListener(event, invalidate, true);
    stream.getTracks().forEach((track) => track.stop());
  };
  const fail = (error: unknown) => {
    if (discarded) return;
    discarded = true;
    ended = true;
    release();
    if (recorder.state !== 'inactive') recorder.stop();
    const reason = error instanceof Error ? error : new Error(t('errors.capture'));
    reject(reason);
    onError(reason);
  };
  recorder.ondataavailable = (event) => {
    if (event.data.size && !discarded) chunks.push(event.data);
  };
  recorder.onerror = () => fail(new Error(t('errors.encode')));
  recorder.onstop = async () => {
    release();
    if (discarded) return;
    try {
      let blob = new Blob(chunks, { type: recorder.mimeType });
      if (!blob.size) throw new Error(t('errors.recordEmpty'));
      const extension = recorder.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
      if (extension === 'webm') blob = await fixWebmDuration(blob, durationMs, { logger: false });
      if (transparent && !(await hasTransparentCorners(blob))) throw new Error(formatError);
      resolve({
        blob,
        extension,
        transparent,
        width: canvas.width,
        height: canvas.height,
        durationMs,
      });
    } catch (error) {
      fail(error);
    }
  };
  const snapshot = async () => {
    frame = await capturePhone(node, width, height, backdrop);
  };
  const pump = () => {
    if (ended) return;
    const began = performance.now();
    const wasAnimating = animating;
    animating =
      node
        .getAnimations?.({ subtree: true })
        .some(
          (animation) =>
            animation.playState === 'running' &&
            (animation.effect as KeyframeEffect | null)?.target !== cursor,
        ) ?? false;
    const needsSnapshot = changed || animating || wasAnimating;
    changed = false;
    inFlight = (needsSnapshot ? snapshot() : Promise.resolve())
      .then(() => {
        if (!ended)
          snapshotTimer = setTimeout(
            pump,
            Math.max(0, SNAPSHOT_INTERVAL - (performance.now() - began)),
          );
      })
      .catch(fail);
  };
  let finishing: Promise<RecordedClip> | undefined;
  return {
    start() {
      if (ended || recorder.state !== 'inactive' || startedAt !== undefined)
        throw new Error(t('errors.recordAlreadyStarted'));
      startedAt = performance.now();
      recorder.start(1000);
      // Keep sending the latest image even when there is no new DOM snapshot yet.
      publishFrame();
      frameTimer = setInterval(publishFrame, FRAME_INTERVAL);
      observer.observe(node, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
      for (const event of visualEvents) node.addEventListener(event, invalidate, true);
      pump();
    },
    finish() {
      if (finishing) return finishing;
      finishing = (async () => {
        ended = true;
        clearTimeout(snapshotTimer);
        await inFlight;
        if (discarded) return result;
        if (startedAt === undefined || recorder.state === 'inactive')
          throw new Error(t('errors.recordNotStarted'));
        await snapshot();
        if (discarded) return result;
        // A drawn canvas frame reaches the encoder on a later browser paint.
        // Hold the final image across several capture ticks before flushing the encoder.
        publishFrame();
        holdFinalFrame = true;
        await delay(FINAL_FRAME_HOLD, finalFrame.signal);
        if (discarded) return result;
        clearInterval(frameTimer);
        durationMs = Math.max(1, performance.now() - startedAt);
        recorder.stop();
        return result;
      })().catch((error) => {
        fail(error);
        return result;
      });
      return finishing;
    },
    cancel() {
      if (discarded) return;
      discarded = true;
      ended = true;
      release();
      if (recorder.state !== 'inactive') recorder.stop();
      reject(new DOMException(t('errors.recordCancelled'), 'AbortError'));
    },
  };
}
