// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { readingLines } from '../src/features/playback/readingScan';
import { useCursor } from '../src/features/playback/hooks/useCursor';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.innerHTML = '';
});
function layout() {
  const phone = document.createElement('div');
  phone.innerHTML =
    '<article>First <strong>bold</strong><p>Second</p><small>helper</small><h3>Subtitle</h3><time>12:00</time><span aria-hidden="true">hidden</span></article>';
  document.body.append(phone);
  const rect = (left: number, top: number, right: number, bottom: number) =>
    ({ left, top, right, bottom, width: right - left, height: bottom - top }) as DOMRect;
  vi.spyOn(phone, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 200, 200));
  vi.spyOn(document, 'createRange').mockImplementation(() => {
    let text = '';
    return {
      selectNodeContents: (node: Node) => {
        text = node.textContent ?? '';
      },
      getClientRects: () =>
        text === 'First '
          ? [rect(10, 20, 50, 30)]
          : text === 'bold'
            ? [rect(50, 20, 100, 30)]
            : [rect(20, 50, 90, 60)],
    } as unknown as Range;
  });
  return { phone, article: phone.firstElementChild as HTMLElement };
}
it('merges formatted fragments into text lines and excludes timestamps and hidden labels', () => {
  const { phone, article } = layout();
  expect(readingLines(article, phone)).toEqual([
    { left: 10, right: 100, top: 20, bottom: 30 },
    { left: 20, right: 90, top: 50, bottom: 60 },
  ]);
});
it('makes a brief attention movement and aborts without later movement', async () => {
  vi.useFakeTimers();
  const { phone, article } = layout();
  const { result } = renderHook(() => useCursor({ current: phone }));
  const controller = new AbortController();
  let read!: Promise<void>;
  act(() => {
    read = result.current.read('word '.repeat(40), controller.signal, article);
  });
  const rejected = read.catch((error) => error.name);
  expect(result.current.cursor.visible).toBe(false);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2400);
  });
  expect(result.current.cursor.visible).toBe(true);
  expect(result.current.cursor.pressed).toBe(false);
  expect(result.current.cursor.x).toBeGreaterThan(10);
  expect(result.current.cursor.x).toBeLessThan(100);
  expect(result.current.cursor.y).toBeGreaterThanOrEqual(20);
  expect(result.current.cursor.y).toBeLessThanOrEqual(30);
  act(() => {
    controller.abort();
    result.current.hide();
  });
  expect(await rejected).toBe('AbortError');
  const stopped = result.current.cursor;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(result.current.cursor).toEqual(stopped);
  expect(stopped.visible).toBe(false);
});
