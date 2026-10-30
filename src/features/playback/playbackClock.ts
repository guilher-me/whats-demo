import { abortError } from '../../core/async';

interface PendingDelay {
  remaining: number;
  started: number;
  timer?: ReturnType<typeof setTimeout>;
  resolve: () => void;
  reject: (reason: unknown) => void;
}

/** Keeps one run alive while suspending its timers, without replaying completed actions. */
export class PlaybackClock {
  paused = false;
  private pending = new Set<PendingDelay>();
  constructor(readonly signal: AbortSignal) {
    signal.addEventListener('abort', this.cancel, { once: true });
  }
  private arm = (entry: PendingDelay) => {
    entry.started = performance.now();
    entry.timer = setTimeout(() => {
      this.pending.delete(entry);
      entry.resolve();
    }, entry.remaining);
  };
  delay = (milliseconds: number): Promise<void> => {
    if (this.signal.aborted) return Promise.reject(abortError());
    return new Promise((resolve, reject) => {
      const entry: PendingDelay = {
        remaining: Math.max(0, milliseconds),
        started: 0,
        resolve,
        reject,
      };
      this.pending.add(entry);
      if (!this.paused) this.arm(entry);
    });
  };
  checkpoint = () =>
    this.signal.aborted
      ? Promise.reject(abortError())
      : this.paused
        ? this.delay(0)
        : Promise.resolve();
  pause = () => {
    if (this.paused || this.signal.aborted) return;
    this.paused = true;
    for (const entry of this.pending) {
      clearTimeout(entry.timer);
      entry.remaining = Math.max(0, entry.remaining - (performance.now() - entry.started));
    }
  };
  resume = () => {
    if (!this.paused || this.signal.aborted) return;
    this.paused = false;
    for (const entry of this.pending) this.arm(entry);
  };
  private cancel = () => {
    for (const entry of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(abortError());
    }
    this.pending.clear();
    this.dispose();
  };
  dispose = () => this.signal.removeEventListener('abort', this.cancel);
}
