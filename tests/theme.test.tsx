// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { ThemeProvider, ThemeSwitch } from '../src/features/theme/Theme';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

it('starts light and restores the local theme after a keyboard toggle', async () => {
  const user = userEvent.setup();
  const renderSwitch = () =>
    render(
      <ThemeProvider>
        <ThemeSwitch />
      </ThemeProvider>,
    );
  const first = renderSwitch();
  const control = screen.getByRole('switch', { name: 'Modo escuro' });
  expect(control.getAttribute('aria-checked')).toBe('false');
  await user.tab();
  expect(document.activeElement).toBe(control);
  await user.keyboard(' ');
  expect(control.getAttribute('aria-checked')).toBe('true');
  expect(document.documentElement.dataset.theme).toBe('dark');
  first.unmount();

  renderSwitch();
  expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  await user.click(screen.getByRole('switch'));
  expect(localStorage.getItem('whatsdemo-theme')).toBe('light');
});

it('can change theme for the current page when storage is denied', async () => {
  const denyStorage = () => {
    throw new DOMException('Storage denied', 'SecurityError');
  };
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denyStorage);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denyStorage);
  render(
    <ThemeProvider>
      <ThemeSwitch />
    </ThemeProvider>,
  );
  await userEvent.click(screen.getByRole('switch'));
  expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  expect(document.documentElement.dataset.theme).toBe('dark');
});
