import { t } from '../../../i18n';
import { useState, type RefObject } from 'react';
import { delay } from '../../../core/async';
import { readingDuration } from '../humanTiming';
import { readingLines } from '../readingScan';
import { abortError } from '../../../core/async';
export interface CursorState {
  x: number;
  y: number;
  visible: boolean;
  pressed: boolean;
  travelMs?: number;
}
export function useCursor(phone: RefObject<HTMLDivElement | null>, wait: typeof delay = delay) {
  const [cursor, setCursor] = useState<CursorState>({ x: 0, y: 0, visible: false, pressed: false });
  const hide = () => setCursor((c) => ({ ...c, visible: false, pressed: false }));
  const touch = async (element: HTMLElement | null, signal: AbortSignal, action?: () => void) => {
    if (!element || !phone.current) throw new Error(t('errors.cursor'));
    element.scrollIntoView?.({ block: 'nearest' });
    const bounds = phone.current.getBoundingClientRect(),
      target = element.getBoundingClientRect();
    setCursor({
      x: target.left - bounds.left + target.width / 2 - phone.current.clientLeft,
      y: target.top - bounds.top + target.height / 2 - phone.current.clientTop,
      visible: true,
      pressed: false,
    });
    await wait(380, signal);
    setCursor((c) => ({ ...c, pressed: true }));
    await wait(100, signal);
    action?.();
    setCursor((c) => ({ ...c, pressed: false }));
    await wait(300, signal);
  };
  const type = async (
    element: HTMLElement | null,
    text: string,
    signal: AbortSignal,
    update: (value: string) => void,
    date = false,
  ) => {
    await touch(element, signal, () => element?.focus());
    update('');
    if (date) {
      await wait(250, signal);
      update(text);
    } else {
      let value = '';
      for (const char of text) {
        await wait(75, signal);
        value += char;
        update(value);
      }
    }
    await wait(200, signal);
  };
  const read = async (text: string, signal: AbortSignal, element?: HTMLElement | null) => {
    if (signal.aborted) throw abortError();
    const surface = phone.current;
    const duration = readingDuration(text);
    if (!surface || !element || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
      return wait(duration, signal);
    element.scrollIntoView?.({ block: 'nearest' });
    const lines = readingLines(element, surface);
    if (!lines.length) return wait(duration, signal);
    const segment = duration / lines.length;
    const bounds = surface.getBoundingClientRect();
    const move = (x: number, y: number, travelMs: number) =>
      setCursor({
        x: x - bounds.left - surface.clientLeft,
        y: y - bounds.top - surface.clientTop,
        visible: true,
        pressed: false,
        travelMs,
      });
    for (const line of lines) {
      if (signal.aborted) throw abortError();
      const y = (line.top + line.bottom) / 2;
      move(line.left, y, segment * 0.2);
      await wait(segment * 0.2, signal);
      move(line.right, y, segment * 0.8);
      await wait(segment * 0.8, signal);
    }
  };
  return { cursor, touch, type, read, hide };
}
