// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ShareButton } from '../src/features/sharing/ShareButton';
import { createDefaultProject } from '../src/core/defaults';
vi.mock('../src/core/codec', () => ({
  createURL: vi.fn(async () => 'https://example.com/#project=v1j.backup'),
}));
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it('clears the copied feedback timer when the confirmation closes', async () => {
  const writeText = vi.fn(async () => {});
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  const view = render(<ShareButton project={createDefaultProject()} onError={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));
  await act(async () => {});
  expect(writeText).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: /copiado/ })).toBeInTheDocument();
  expect(vi.getTimerCount()).toBe(1);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(3000);
});
it('does not schedule feedback or update state if clipboard access finishes after unmount', async () => {
  let finish!: () => void;
  const writeText = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  const onError = vi.fn();
  const view = render(<ShareButton project={createDefaultProject()} onError={onError} />);
  fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));
  await act(async () => {});
  expect(writeText).toHaveBeenCalledOnce();
  view.unmount();
  await act(async () => {
    finish();
  });
  expect(onError).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
