// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { capturePhone } from '../src/features/recording/capture';
import { preparePhoneRecording, recordingSupport } from '../src/features/recording/session';
import fixWebmDuration from 'fix-webm-duration';
vi.mock('../src/features/recording/capture', () => ({ capturePhone: vi.fn() }));
vi.mock('fix-webm-duration', () => ({ default: vi.fn(async (blob: Blob) => blob) }));
class FakeMediaRecorder {
  static supported = new Set(['video/mp4', 'video/webm']);
  static isTypeSupported(type: string) {
    return this.supported.has(type);
  }
  state = 'inactive';
  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(_: MediaStream, options: MediaRecorderOptions) {
    this.mimeType = options.mimeType!;
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob(['video-bytes']) } as BlobEvent);
      this.onstop?.();
    });
  }
}
const stopTrack = vi.fn();
const captureStream = vi.fn(
  () =>
    ({
      getTracks: () => [{ stop: stopTrack }],
      getVideoTracks: () => [],
    }) as unknown as MediaStream,
);
const pixels = vi.fn(() => ({ data: new Uint8ClampedArray(4) }));
beforeEach(() => {
  vi.clearAllMocks();
  FakeMediaRecorder.supported = new Set(['video/mp4', 'video/webm']);
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', {
    configurable: true,
    value: captureStream,
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillStyle: '',
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: pixels,
  } as unknown as CanvasRenderingContext2D);
  vi.mocked(capturePhone).mockResolvedValue(document.createElement('canvas'));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (HTMLCanvasElement.prototype as Partial<HTMLCanvasElement>).captureStream;
});
function phone() {
  const node = document.createElement('div');
  Object.defineProperties(node, { offsetWidth: { value: 360 }, offsetHeight: { value: 720 } });
  return node;
}
it('gera MP4 nativo e libera todas as tracks ao finalizar', async () => {
  const session = await preparePhoneRecording(phone(), vi.fn());
  session.start();
  const first = session.finish();
  expect(session.finish()).toBe(first);
  const clip = await first;
  expect(clip.extension).toBe('mp4');
  expect(clip.blob.size).toBeGreaterThan(0);
  expect([clip.width, clip.height]).toEqual([720, 1440]);
  expect(stopTrack).toHaveBeenCalled();
  expect(fixWebmDuration).not.toHaveBeenCalled();
});
it('keeps publishing frames while the screen is unchanged and holds the last snapshot before stopping', async () => {
  vi.useFakeTimers();
  const stop = vi.spyOn(FakeMediaRecorder.prototype, 'stop');
  const session = await preparePhoneRecording(phone(), vi.fn());
  const draw = document.createElement('canvas').getContext('2d')!.drawImage;
  session.start();
  await vi.advanceTimersByTimeAsync(1000);
  expect(capturePhone).toHaveBeenCalledTimes(2);
  expect(vi.mocked(draw).mock.calls.length).toBeGreaterThan(10);
  const final = document.createElement('canvas');
  vi.mocked(capturePhone).mockResolvedValueOnce(final);
  const finish = session.finish();
  await vi.advanceTimersByTimeAsync(100);
  expect(draw).toHaveBeenLastCalledWith(final, 0, 0, 720, 1440);
  expect(stop).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(400);
  const clip = await finish;
  expect(clip.durationMs).toBeCloseTo(1400);
  expect(stop).toHaveBeenCalledOnce();
});

it('uses the theme backdrop selected when preparing every frame of a recording', async () => {
  const node = phone();
  node.style.setProperty('--recording-backdrop', '#213c35');
  const context = document.createElement('canvas').getContext('2d')!;
  const session = await preparePhoneRecording(node, vi.fn());
  expect(context.fillStyle).toBe('#213c35');
  node.style.setProperty('--recording-backdrop', '#fff');
  session.start();
  await session.finish();
  const calls = vi.mocked(capturePhone).mock.calls;
  expect(calls.length).toBeGreaterThan(1);
  for (const call of calls) expect(call).toEqual([node, 360, 720, '#213c35']);
});
it('usa WebM quando MP4 não está disponível e corrige a duração', async () => {
  FakeMediaRecorder.supported = new Set(['video/webm']);
  const session = await preparePhoneRecording(phone(), vi.fn());
  session.start();
  const clip = await session.finish();
  expect(clip.extension).toBe('webm');
  expect(fixWebmDuration).toHaveBeenCalledOnce();
});
it('cancela uma sessão preparada antes do início sem deixar tracks abertas', async () => {
  const session = await preparePhoneRecording(phone(), vi.fn());
  session.cancel();
  session.cancel();
  expect(stopTrack).toHaveBeenCalledOnce();
  expect(() => session.start()).toThrow('cancelada');
});
it('rejeita canvas bloqueado antes de abrir o stream', async () => {
  pixels.mockImplementationOnce(() => {
    throw new DOMException('Tainted', 'SecurityError');
  });
  await expect(preparePhoneRecording(phone(), vi.fn())).rejects.toThrow('Tainted');
  expect(captureStream).not.toHaveBeenCalled();
});
it('fecha os recursos e sinaliza falha de captura depois de iniciar', async () => {
  const onError = vi.fn();
  const session = await preparePhoneRecording(phone(), onError);
  vi.mocked(capturePhone).mockRejectedValueOnce(new Error('Falha do quadro'));
  session.start();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await expect(session.finish()).rejects.toThrow('Falha do quadro');
  expect(onError).toHaveBeenCalledOnce();
  expect(stopTrack).toHaveBeenCalled();
});
it('detecta navegadores sem MediaRecorder', () => {
  vi.stubGlobal('MediaRecorder', undefined);
  expect(recordingSupport()).toContain('navegador');
});
