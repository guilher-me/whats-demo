// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useCursor } from '../src/features/playback/hooks/useCursor';
import { readingDuration } from '../src/features/playback/humanTiming';
import { delay } from '../src/core/async';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
it.each([0.5, 1, 3])('scales reading, movement and click time at %sx', async (speed) => {
  const phone = document.createElement('div');
  const target = document.createElement('button');
  phone.append(target);
  const { result } = renderHook(() =>
    useCursor({ current: phone }, (ms, signal) => delay(ms / speed, signal)),
  );
  const signal = new AbortController().signal;
  const readDone = vi.fn();
  const clicked = vi.fn();
  let reading!: Promise<void>;
  act(() => {
    reading = result.current.read('Hello there', signal).then(readDone);
  });
  await tick(Math.floor(readingDuration('Hello there') / speed) - 1);
  expect(readDone).not.toHaveBeenCalled();
  await tick(1);
  await reading;
  expect(readDone).toHaveBeenCalledOnce();
  act(() => {
    void result.current.touch(target, signal, clicked);
  });
  await tick(Math.floor(380 / speed) + Math.floor(100 / speed) - 1);
  expect(clicked).not.toHaveBeenCalled();
  await tick(1);
  expect(clicked).toHaveBeenCalledOnce();
  await tick(1000);
});
it('lets a longer message take longer to read, with a bounded maximum', () => {
  expect(readingDuration('A short message')).toBeLessThan(
    readingDuration('Longer message '.repeat(12)),
  );
  expect(readingDuration('word '.repeat(10000))).toBe(5000);
});
