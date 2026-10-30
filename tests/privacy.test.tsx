// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { PrivacyNotice } from '../src/features/privacy/PrivacyNotice';
import { i18n, locales, t } from '../src/i18n';
import { STORAGE_KEY } from '../src/core/project';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('opens the privacy notice without changing stored data and restores keyboard focus on close', async () => {
  const user = userEvent.setup();
  localStorage.setItem(STORAGE_KEY, '{"existing":"draft"}');
  const before = localStorage.getItem(STORAGE_KEY);
  render(<PrivacyNotice />);
  const trigger = screen.getByRole('button', { name: 'Privacidade' });
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Privacidade no WhatsDemo' });
  expect(dialog).toHaveTextContent('localStorage');
  expect(dialog).toHaveTextContent('Os arquivos não são criptografados.');
  expect(dialog).toHaveTextContent('configurações de privacidade ou armazenamento');
  expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(trigger).toHaveFocus();
  expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
});

it.each(locales)('provides an accessible, translated notice in %s', async (locale) => {
  await i18n.changeLanguage(locale);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const user = userEvent.setup();
  render(<PrivacyNotice />);
  await user.click(screen.getByRole('button', { name: t('privacy.link') }));
  const dialog = screen.getByRole('dialog', { name: t('privacy.title') });
  for (const key of [
    'privacy.storageTitle',
    'privacy.sharingTitle',
    'privacy.deleteTitle',
    'privacy.connectionsTitle',
  ] as const) {
    expect(screen.getByRole('heading', { name: t(key) })).toBeInTheDocument();
  }
  expect(
    (await axe.run(dialog, { rules: { 'color-contrast': { enabled: false } } })).violations.map(
      (v) => v.id,
    ),
  ).toEqual([]);
  await user.click(screen.getByRole('button', { name: t('common.closeDialog') }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('can be disabled while recording', async () => {
  const user = userEvent.setup();
  render(<PrivacyNotice disabled />);
  const trigger = screen.getByRole('button', { name: 'Privacidade' });
  expect(trigger).toBeDisabled();
  await user.click(trigger);
  expect(screen.queryByRole('dialog')).toBeNull();
});
