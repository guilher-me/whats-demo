// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AgentGuideLink } from '../src/features/automation/AgentGuideLink';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.getElementById('llms-txt')?.remove();
});

it('exposes a normal crawlable link for hosted deployments', () => {
  render(<AgentGuideLink />);
  const link = screen.getByRole('link', { name: 'Guia de interação para IAs (llms.txt)' });
  expect(link).toHaveAttribute('href', './llms.txt');
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).not.toHaveAttribute('download');
});

it('provides the embedded guide when only the portable HTML is available', () => {
  vi.spyOn(window, 'location', 'get').mockReturnValue({ protocol: 'file:' } as Location);
  const embedded = document.createElement('script');
  embedded.type = 'text/plain';
  embedded.id = 'llms-txt';
  embedded.textContent = '# Guide\nUse labeled fields. Preserve user data.';
  document.head.append(embedded);
  const createObjectURL = vi.fn(() => 'blob:embedded-guide');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  const { unmount } = render(<AgentGuideLink />);
  const link = screen.getByRole('link');
  expect(link).toHaveAttribute('href', 'blob:embedded-guide');
  expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  expect(link).not.toHaveAttribute('download');
  expect(link).toHaveAttribute('target', '_blank');
  unmount();
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:embedded-guide');
});
