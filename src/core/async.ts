import { t } from '../i18n';
export function abortError() {
  return new DOMException(t('playback.cancelled'), 'AbortError');
}
export function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const cancel = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, milliseconds);
    signal.addEventListener('abort', cancel, { once: true });
  });
}
export function deferred(signal: AbortSignal) {
  let finish: () => void = () => {};
  const promise = new Promise<void>((resolve, reject) => {
    const cancel = () => {
      signal.removeEventListener('abort', cancel);
      reject(abortError());
    };
    finish = () => {
      signal.removeEventListener('abort', cancel);
      resolve();
    };
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    signal.addEventListener('abort', cancel, { once: true });
  });
  // A canceled run may be awaiting a cursor animation before awaiting this promise.
  void promise.catch(() => {});
  return { promise, finish };
}
