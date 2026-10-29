import fixWebmDuration from 'fix-webm-duration';
import { capturePhone } from './capture';
import type { PhoneRecording, RecordedClip } from './types';

export function recordingSupport(): string {
  if (
    typeof MediaRecorder === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined' ||
    typeof HTMLCanvasElement.prototype.captureStream !== 'function'
  )
    return 'Este navegador não permite gravar o celular. Abra o HTML no Chrome ou Edge atualizado.';
  return '';
}
export function recordingMimeTypes(): string[] {
  return ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].filter(
    (type) => MediaRecorder.isTypeSupported(type),
  );
}

export async function preparePhoneRecording(
  node: HTMLElement,
  onError: (error: Error) => void,
): Promise<PhoneRecording> {
  const unsupported = recordingSupport();
  if (unsupported) throw new Error(unsupported);
  const width = node.offsetWidth,
    height = node.offsetHeight;
  if (!width || !height) throw new Error('O celular precisa estar visível antes de gravar.');
  const first = await capturePhone(node, width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível preparar a imagem do celular.');
  const paint = (frame: HTMLCanvasElement) => {
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(frame, 0, 0, canvas.width, canvas.height);
  };
  paint(first);
  // Detect a tainted canvas before starting a countdown or accumulating a video.
  context.getImageData(0, 0, 1, 1);
  const stream = canvas.captureStream(24);
  let media: MediaRecorder | undefined;
  for (const mimeType of recordingMimeTypes()) {
    try {
      media = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 });
      break;
    } catch {
      /* Try the next native encoder. */
    }
  }
  if (!media) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('Nenhum formato de vídeo compatível foi encontrado.');
  }
  const recorder = media;
  const chunks: Blob[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined,
    ended = false,
    discarded = false,
    startedAt = 0;
  let inFlight: Promise<void> = Promise.resolve();
  let resolve!: (clip: RecordedClip) => void, reject!: (error: Error) => void;
  const result = new Promise<RecordedClip>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  void result.catch(() => {});
  const release = () => {
    clearTimeout(timer);
    stream.getTracks().forEach((track) => track.stop());
  };
  const fail = (error: unknown) => {
    if (discarded) return;
    discarded = true;
    ended = true;
    release();
    if (recorder.state !== 'inactive') recorder.stop();
    const reason =
      error instanceof Error ? error : new Error('Não foi possível capturar o celular.');
    reject(reason);
    onError(reason);
  };
  recorder.ondataavailable = (event) => {
    if (event.data.size && !discarded) chunks.push(event.data);
  };
  recorder.onerror = () => fail(new Error('O navegador não conseguiu codificar o vídeo.'));
  recorder.onstop = async () => {
    release();
    if (discarded) return;
    try {
      let blob = new Blob(chunks, { type: recorder.mimeType });
      if (!blob.size) throw new Error('A gravação ficou vazia. Tente gravar novamente.');
      const durationMs = Math.max(1, performance.now() - startedAt);
      const extension = recorder.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
      if (extension === 'webm') blob = await fixWebmDuration(blob, durationMs, { logger: false });
      resolve({ blob, extension, width: canvas.width, height: canvas.height, durationMs });
    } catch (error) {
      fail(error);
    }
  };
  const draw = async () => {
    const frame = await capturePhone(node, width, height);
    if (!discarded) paint(frame);
  };
  const pump = () => {
    if (ended) return;
    const began = performance.now();
    inFlight = draw()
      .then(() => {
        if (!ended) timer = setTimeout(pump, Math.max(0, 1000 / 12 - (performance.now() - began)));
      })
      .catch(fail);
  };
  let finishing: Promise<RecordedClip> | undefined;
  return {
    start() {
      if (ended || recorder.state !== 'inactive' || startedAt)
        throw new Error('A gravação já foi iniciada ou cancelada.');
      startedAt = performance.now();
      recorder.start(1000);
      pump();
    },
    finish() {
      if (finishing) return finishing;
      finishing = (async () => {
        ended = true;
        clearTimeout(timer);
        await inFlight;
        if (discarded) return result;
        if (recorder.state === 'inactive') throw new Error('A gravação ainda não começou.');
        await draw();
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
      reject(new DOMException('Gravação cancelada.', 'AbortError'));
    },
  };
}
