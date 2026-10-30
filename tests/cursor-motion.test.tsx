// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useCursor } from '../src/features/playback/hooks/useCursor';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
function setup() {
  const phone = document.createElement('div');
  const target = document.createElement('button');
  const rect = (left: number, top: number, width: number, height: number) =>
    ({ left, top, width, height }) as DOMRect;
  vi.spyOn(phone, 'getBoundingClientRect').mockReturnValue(rect(100, 50, 360, 640));
  vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect(120, 70, 40, 20));
  return { phone, target, rect };
}
it('holds its position throughout reading', async () => {
  const { phone, target } = setup();
  const { result } = renderHook(() => useCursor({ current: phone }));
  const signal = new AbortController().signal;
  act(() => {
    void result.current.touch(target, signal);
  });
  await tick(780);
  const before = result.current.cursor;
  let reading!: Promise<void>;
  act(() => {
    reading = result.current.read('A long message '.repeat(20), signal);
  });
  await tick(2500);
  expect(result.current.cursor).toBe(before);
  await tick(2500);
  await reading;
  expect(result.current.cursor).toBe(before);
});
it('uses one destination per action and fades in at the first target', async () => {
  const { phone, target, rect } = setup();
  const { result } = renderHook(() => useCursor({ current: phone }));
  const signal = new AbortController().signal;
  act(() => {
    void result.current.touch(target, signal);
  });
  expect(result.current.cursor).toMatchObject({ x: 40, y: 30, travelMs: 0 });
  await tick(780);
  vi.mocked(target.getBoundingClientRect).mockReturnValue(rect(240, 150, 40, 20));
  const clicked = vi.fn();
  act(() => {
    void result.current.touch(target, signal, clicked);
  });
  expect(result.current.cursor).toMatchObject({ x: 160, y: 110, travelMs: 380, pressed: false });
  await tick(190);
  expect(result.current.cursor).toMatchObject({ x: 160, y: 110, travelMs: 380, pressed: false });
  expect(clicked).not.toHaveBeenCalled();
  await tick(290);
  expect(clicked).toHaveBeenCalledOnce();
  await tick(300);
});
it('cancels an approach without clicking or moving again after stopping', async () => {
  const { phone, target } = setup();
  const { result } = renderHook(() => useCursor({ current: phone }));
  const controller = new AbortController();
  const clicked = vi.fn();
  let moving!: Promise<void>;
  act(() => {
    moving = result.current.touch(target, controller.signal, clicked);
  });
  const cancelled = moving.catch((error) => error.name);
  await tick(190);
  act(() => {
    controller.abort();
    result.current.hide();
  });
  const stopped = result.current.cursor;
  expect(await cancelled).toBe('AbortError');
  await tick(5000);
  expect(clicked).not.toHaveBeenCalled();
  expect(result.current.cursor).toEqual(stopped);
  expect(stopped.visible).toBe(false);
});
