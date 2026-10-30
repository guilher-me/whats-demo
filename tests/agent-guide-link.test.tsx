// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AgentGuideLink } from '../src/features/automation/AgentGuideLink';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.getElementById('llms-txt')?.remove();
});

it('exposes a normal crawlable link for hosted deployments', () => {
  render(<AgentGuideLink />);
  const link = screen.getByRole('link', { name: 'Guia de interação para IAs (llm.txt)' });
  expect(link).toHaveAttribute('href', './llm.txt');
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
  render(<AgentGuideLink />);
  const link = screen.getByRole('link');
  expect(decodeURIComponent(link.getAttribute('href')!)).toBe(
    'data:text/plain;charset=utf-8,' + embedded.textContent,
  );
  expect(link).toHaveAttribute('download', 'llm.txt');
  expect(link).not.toHaveAttribute('target');
});
