// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { App } from '../src/app/App';
import { catalogs, i18n, initialLocale, LOCALE_KEY, locales, t } from '../src/i18n';
import { createDefaultProject } from '../src/core/defaults';
import { STORAGE_KEY } from '../src/core/project';
import { businessMessageError } from '../src/core/interactive';
beforeEach(async () => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  await i18n.changeLanguage('en');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('uses English by default, honors only supported saved choices and tolerates blocked storage', () => {
  localStorage.clear();
  expect(initialLocale()).toBe('en');
  localStorage.setItem(LOCALE_KEY, 'es');
  expect(initialLocale()).toBe('es');
  localStorage.setItem(LOCALE_KEY, 'fr');
  expect(initialLocale()).toBe('en');
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(initialLocale()).toBe('en');
});

it('switches all three interfaces, persists the choice and preserves the project and shared link', async () => {
  // jsdom's Blob lacks stream(); exercise the portable JSON share-link fallback here.
  vi.stubGlobal('CompressionStream', undefined);
  const project = createDefaultProject();
  project.contact.avatar = '';
  project.steps = [
    { id: 'message', type: 'business', text: 'Mensagem original do usuário', delay: 0 },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
  expect(screen.getByRole('heading', { name: 'Build the conversation' })).toBeInTheDocument();
  expect(document.documentElement).toHaveAttribute('lang', 'en');
  const before = window.whatsappFakeFlows!.getProject();
  const link = await window.whatsappFakeFlows!.createShareURL();
  const spanish = screen.getByRole('button', { name: 'Español' });
  fireEvent.click(spanish);
  expect(screen.getByRole('heading', { name: 'Crea la conversación' })).toBeInTheDocument();
  expect(spanish).toHaveAttribute('aria-pressed', 'true');
  expect(document.documentElement.lang).toBe('es');
  expect(localStorage.getItem(LOCALE_KEY)).toBe('es');
  expect(screen.getByRole('button', { name: '＋ Empresa' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Português (Brasil)' }));
  expect(screen.getByRole('heading', { name: 'Monte a conversa' })).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('pt-BR');
  expect(screen.getByLabelText('Texto da mensagem')).toHaveValue('Mensagem original do usuário');
  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByRole('button', { name: '＋ Business' })).toBeInTheDocument();
  expect(window.whatsappFakeFlows!.getProject()).toEqual(before);
  expect(await window.whatsappFakeFlows!.createShareURL()).toBe(link);
});

it('has complete catalogs with matching interpolation variables', () => {
  for (const locale of locales) {
    expect(Object.keys(catalogs[locale]).sort()).toEqual(Object.keys(catalogs.en).sort());
    for (const key of Object.keys(catalogs.en) as (keyof typeof catalogs.en)[]) {
      expect(catalogs[locale][key].trim(), `${locale}: ${key}`).not.toBe('');
      expect([...catalogs[locale][key].matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort()).toEqual(
        [...catalogs.en[key].matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort(),
      );
    }
  }
});

it.each(locales)(
  'localizes validation and has accessible language controls in %s',
  async (locale) => {
    await i18n.changeLanguage(locale);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<App />);
    await act(async () => {});
    const group = screen.getByRole('group', { name: t('language.label') });
    expect(within(group).getAllByRole('button')).toHaveLength(3);
    expect(group.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(1);
    const error = businessMessageError({
      text: '',
      interactive: { kind: 'buttons', buttons: [{ id: 'a', title: 'A' }] },
    });
    expect(error).toBe(t('errors.messageRequired'));
    const result = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations.map((v) => v.id)).toEqual([]);
  },
);

it('refreshes playback status after a language switch without restarting the conversation', async () => {
  const project = createDefaultProject();
  project.contact.avatar = '';
  project.steps = [{ id: 'user', type: 'user', text: 'oi', delay: 0 }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Start manually' }));
  await act(async () => {});
  expect(window.whatsappFakeFlows!.getState().running).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Español' }));
  expect(document.querySelector('.play-status')).toHaveTextContent(
    'Escribe y envía el mensaje del cliente para continuar.',
  );
  expect(window.whatsappFakeFlows!.getState().running).toBe(true);
});
