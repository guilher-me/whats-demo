import { t } from '../../i18n';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { delay } from '../../core/async';
import { preparePhoneRecording } from './session';
import type { PhoneRecording, RecordedClip, RecordingMode, RecordingPhase } from './types';
interface Options {
  phone: RefObject<HTMLDivElement | null>;
  prepare: () => void;
  run: (automatic: boolean) => Promise<void>;
  stopPlayback: () => void;
  playbackStatus: () => string;
}
export function useRecording(options: Options) {
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  const [phase, setPhase] = useState<RecordingPhase>('idle'),
    [countdown, setCountdown] = useState(3),
    [elapsed, setElapsed] = useState(0),
    [error, setError] = useState(''),
    [result, setResult] = useState<(RecordedClip & { url: string }) | null>(null);
  const operation = useRef<AbortController | null>(null),
    session = useRef<PhoneRecording | null>(null),
    interval = useRef<ReturnType<typeof setInterval> | undefined>(undefined),
    started = useRef(false),
    resultURL = useRef<string | null>(null),
    finishing = useRef(false);
  const clearClock = () => {
    clearInterval(interval.current);
    interval.current = undefined;
  };
  const discard = () => {
    if (resultURL.current) URL.revokeObjectURL(resultURL.current);
    resultURL.current = null;
    setResult(null);
  };
  const cancel = () => {
    operation.current?.abort();
    operation.current = null;
    session.current?.cancel();
    session.current = null;
    started.current = false;
    finishing.current = false;
    clearClock();
    latest.current.stopPlayback();
    setPhase('idle');
  };
  const fail = (active: AbortController, reason: unknown) => {
    if (operation.current !== active) return;
    cancel();
    setError(
      reason instanceof DOMException && reason.name === 'SecurityError'
        ? t('errors.captureBlocked')
        : reason instanceof Error
          ? reason.message
          : t('errors.record'),
    );
  };
  const finish = async () => {
    const active = operation.current,
      recorder = session.current;
    if (!active || finishing.current) return;
    if (!recorder || !started.current) {
      cancel();
      return;
    }
    finishing.current = true;
    active.abort();
    clearClock();
    setPhase('finishing');
    try {
      const clip = await recorder.finish();
      if (operation.current !== active) return;
      const url = URL.createObjectURL(clip.blob);
      latest.current.stopPlayback();
      operation.current = null;
      session.current = null;
      started.current = false;
      finishing.current = false;
      resultURL.current = url;
      setResult({ ...clip, url });
      setPhase('idle');
    } catch (reason) {
      fail(active, reason);
    }
  };
  const start = async (mode: RecordingMode) => {
    if (operation.current) return;
    discard();
    setError('');
    setElapsed(0);
    setCountdown(3);
    setPhase('preparing');
    const active = new AbortController();
    operation.current = active;
    try {
      latest.current.prepare();
      await delay(0, active.signal);
      const node = latest.current.phone.current;
      if (!node) throw new Error(t('errors.phoneUnavailable'));
      const recorder = await preparePhoneRecording(node, (reason) => fail(active, reason));
      if (active.signal.aborted || operation.current !== active) {
        recorder.cancel();
        return;
      }
      session.current = recorder;
      setPhase('countdown');
      for (let seconds = 3; seconds > 0; seconds--) {
        setCountdown(seconds);
        await delay(1000, active.signal);
      }
      recorder.start();
      started.current = true;
      setPhase('recording');
      const began = performance.now();
      interval.current = setInterval(
        () => setElapsed(Math.floor((performance.now() - began) / 1000)),
        250,
      );
      const playback = latest.current.run(mode === 'automatic');
      if (mode === 'automatic') {
        await playback;
        if (active.signal.aborted || operation.current !== active) return;
        if (latest.current.playbackStatus() === t('playback.completed'))
          await delay(2000, active.signal);
        await finish();
      } else {
        void playback.catch((reason) => fail(active, reason));
      }
    } catch (reason) {
      if (!active.signal.aborted) fail(active, reason);
    }
  };
  useEffect(
    () => () => {
      operation.current?.abort();
      operation.current = null;
      session.current?.cancel();
      clearInterval(interval.current);
      if (resultURL.current) URL.revokeObjectURL(resultURL.current);
    },
    [],
  );
  return {
    phase,
    busy: phase !== 'idle',
    countdown,
    elapsed,
    result,
    error,
    start,
    finish,
    cancel,
    discard,
    clearError: () => setError(''),
  };
}
export type RecordingController = ReturnType<typeof useRecording>;
