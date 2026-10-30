// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SafeAvatar } from '../src/components/ui/SafeAvatar';
import { FALLBACK_AVATAR } from '../src/core/avatarAssets';

const { sanitize } = vi.hoisted(() => ({ sanitize: vi.fn() }));
vi.mock('../src/core/images/sanitize', () => ({ sanitizeAvatar: sanitize }));
afterEach(() => {
  cleanup();
  sanitize.mockReset();
});
it('never attaches an unprocessed source, and ignores a stale decode after replacement', async () => {
  let completeFirst!: (value: string) => void;
  let completeSecond!: (value: string) => void;
  sanitize
    .mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          completeFirst = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          completeSecond = resolve;
        }),
    );
  const { rerender } = render(<SafeAvatar value="untrusted-first" alt="Contact" />);
  expect(screen.getByAltText('Contact').getAttribute('src')).toBe(FALLBACK_AVATAR);
  rerender(<SafeAvatar value="untrusted-second" alt="Contact" />);
  await act(async () => {
    completeFirst('stale-output');
  });
  expect(screen.getByAltText('Contact').getAttribute('src')).toBe(FALLBACK_AVATAR);
  await act(async () => {
    completeSecond('processed-output');
  });
  expect(screen.getByAltText('Contact').getAttribute('src')).toBe('processed-output');
  rerender(<SafeAvatar value="" alt="Contact" />);
  expect(screen.getByAltText('Contact').getAttribute('src')).toBe(FALLBACK_AVATAR);
});
it('uses the fallback after a failed security check', async () => {
  sanitize.mockRejectedValue(new Error('bad image'));
  render(<SafeAvatar value="data:image/svg+xml,hostile" alt="Contact" />);
  await act(async () => {});
  expect(screen.getByAltText('Contact').getAttribute('src')).toBe(FALLBACK_AVATAR);
});
