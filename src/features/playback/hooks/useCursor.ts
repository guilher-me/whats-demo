import { t } from '../../../i18n';
import { useRef, useState, type RefObject, type SetStateAction } from 'react';
import { delay } from '../../../core/async';
import { readingDuration } from '../humanTiming';
import { readingLines } from '../readingScan';
import { abortError } from '../../../core/async';
import {
  approachPoint,
  attentionPoints,
  motionRandom,
  safeClickPoint,
  type Point,
} from '../humanMotion';
export interface CursorState {
  x: number;
  y: number;
  visible: boolean;
  pressed: boolean;
  travelMs?: number;
}
export function useCursor(phone: RefObject<HTMLDivElement | null>, wait: typeof delay = delay) {
  const [cursor, setState] = useState<CursorState>({ x: 0, y: 0, visible: false, pressed: false });
  const current = useRef(cursor);
  const random = useRef(motionRandom());
  const setCursor = (update: SetStateAction<CursorState>) => {
    current.current = typeof update === 'function' ? update(current.current) : update;
    setState(current.current);
  };
  const hide = () => {
    random.current = motionRandom();
    setCursor((c) => ({ ...c, visible: false, pressed: false }));
  };
  const approach = async (point: Point, milliseconds: number, signal: AbortSignal) => {
    if (signal.aborted) throw abortError();
    const start = current.current.visible ? current.current : { x: point.x - 10, y: point.y + 6 };
    const via = approachPoint(start, point, random.current);
    const bounds = phone.current?.getBoundingClientRect();
    for (const target of [via, point]) {
      setCursor({
        x: Math.max(0, Math.min(bounds?.width || Infinity, target.x)),
        y: Math.max(0, Math.min(bounds?.height || Infinity, target.y)),
        visible: true,
        pressed: false,
        travelMs: milliseconds / 2,
      });
      await wait(milliseconds / 2, signal);
    }
  };
  const touch = async (element: HTMLElement | null, signal: AbortSignal, action?: () => void) => {
    if (!element || !phone.current) throw new Error(t('errors.cursor'));
    element.scrollIntoView?.({ block: 'nearest' });
    const bounds = phone.current.getBoundingClientRect(),
      target = element.getBoundingClientRect();
    const point = safeClickPoint(target, random.current);
    await approach(
      {
        x: point.x - bounds.left - phone.current.clientLeft,
        y: point.y - bounds.top - phone.current.clientTop,
      },
      380,
      signal,
    );
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
    const points = attentionPoints(lines, text, random.current);
    if (!points.length) return wait(duration, signal);
    const bounds = surface.getBoundingClientRect();
    const segment = duration / points.length;
    for (const point of points) {
      // Most reading time is spent still; a brief glance occupies only part of the pause.
      const before = segment * (0.22 + random.current() * 0.16);
      const movement = Math.min(420, segment * 0.3);
      await wait(before, signal);
      await approach(
        {
          x: point.x - bounds.left - surface.clientLeft,
          y: point.y - bounds.top - surface.clientTop,
        },
        movement,
        signal,
      );
      await wait(Math.max(0, segment - before - movement), signal);
    }
  };
  return { cursor, touch, type, read, hide };
}
