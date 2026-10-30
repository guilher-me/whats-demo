// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { App } from '../src/app/App';
import { STORAGE_KEY } from '../src/core/project';
import { createDefaultProject } from '../src/core/defaults';
import { createURL, decode } from '../src/core/codec';
import * as codec from '../src/core/codec';
import { i18n } from '../src/i18n';

function project(name: string) {
  const value = createDefaultProject();
  value.contact = { name, avatar: '', verified: false };
  value.steps = [{ id: 'hello', type: 'user', text: 'Hello', delay: 0 }];
  return value;
}
const bakery = () => project('Padaria do Seu Zé');
const salon = () => project('Cabeleireira Leila');
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  localStorage.clear();
  history.replaceState(null, '', '/whats-demo/?test=1');
  vi.stubGlobal('CompressionStream', undefined);
  vi.stubGlobal('DecompressionStream', undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function start() {
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await act(async () => {});
}
async function navigate(hash: string) {
  await act(async () => {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}
async function incoming() {
  return new URL(await createURL(salon(), location.href)).hash;
}
async function pending() {
  return screen.findByRole('dialog', { name: 'Abrir outra experiência?' });
}

it('shows a prominent accessible error and returns to the untouched draft without a reload loop', async () => {
  const original = bakery();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
  history.replaceState(null, '', '?test=1#project=v1j.a');
  await start();
  const heading = await screen.findByRole('heading', {
    name: 'Não foi possível abrir esta experiência',
  });
  expect(heading).toHaveFocus();
  expect(screen.getByRole('main')).toContainElement(heading);
  expect(screen.getByRole('alert')).toHaveTextContent('O link pode estar incompleto');
  expect(screen.queryByRole('region', { name: 'Editor da conversa' })).toBeNull();
  expect(saved()).toEqual(original);
  expect(window.whatsappFakeFlows!.getState().ready).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Continuar meu rascunho' }));
  expect(location.hash).toBe('');
  expect(location.search).toBe('?test=1');
  expect(screen.getByLabelText('Nome do contato')).toHaveValue(original.contact.name);
  expect(saved()).toEqual(original);
  cleanup();
  await start();
  expect(screen.queryByRole('alert')).toBeNull();
});
it('offers the example when there is no draft and leaves it unsaved', async () => {
  history.replaceState(null, '', '#project=v99.broken');
  await start();
  await screen.findByRole('heading', { name: 'Não foi possível abrir esta experiência' });
  expect(screen.queryByRole('button', { name: 'Continuar meu rascunho' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Explorar o exemplo' }));
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Luma Home');
});
it.each(['cancel', 'escape', 'close'])(
  'validates first and preserves the bakery when replacement is dismissed: %s',
  async (action) => {
    const original = bakery();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
    history.replaceState(null, '', await incoming());
    await start();
    const dialog = await pending();
    expect(within(dialog).getByText('Padaria do Seu Zé')).toBeInTheDocument();
    expect(within(dialog).getByText('Cabeleireira Leila')).toBeInTheDocument();
    expect(saved()).toEqual(original);
    expect(window.whatsappFakeFlows!.getProject()).toEqual(original);
    expect(window.whatsappFakeFlows!.getState().ready).toBe(false);
    if (action === 'escape') fireEvent.keyDown(dialog, { key: 'Escape' });
    else
      fireEvent.click(
        within(dialog).getByRole('button', {
          name: action === 'cancel' ? 'Cancelar' : 'Fechar diálogo',
        }),
      );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(location.hash).toBe('');
    expect(saved()).toEqual(original);
    expect(screen.getByLabelText('Nome do contato')).toHaveValue('Padaria do Seu Zé');
  },
);
it('copies the bakery link before replacement, then saves only the confirmed salon', async () => {
  const original = bakery();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
  const writeText = vi.fn(async (_value: string) => {});
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  history.replaceState(null, '', await incoming());
  await start();
  const dialog = await pending();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Copiar link do projeto atual' }));
  await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
  expect(await decode(new URL(writeText.mock.calls[0][0]).hash)).toEqual(original);
  expect(saved()).toEqual(original);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Abrir e substituir' }));
  await waitFor(() => expect(saved()).toEqual(salon()));
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Cabeleireira Leila');
  expect(location.search).toBe('?test=1');
  cleanup();
  await start();
  await waitFor(() => expect(window.whatsappFakeFlows!.getState().ready).toBe(true));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(saved()).toEqual(salon());
});
it('keeps a failed pasted URL and validates another link without navigating to its host', async () => {
  const original = bakery();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
  history.replaceState(null, '', '#project=v1j.a');
  await start();
  fireEvent.click(await screen.findByRole('button', { name: 'Colar outro link' }));
  const input = screen.getByLabelText('Link completo da experiência');
  fireEvent.change(input, { target: { value: 'https://example.com/#project=v1j.b' } });
  fireEvent.click(screen.getByRole('button', { name: 'Abrir experiência' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Abrir experiência' })).toBeEnabled(),
  );
  expect(input).toHaveValue('https://example.com/#project=v1j.b');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Verifique se você colou o endereço completo',
  );
  expect(saved()).toEqual(original);
  const next = await createURL(salon(), 'https://elsewhere.example/app');
  fireEvent.change(input, { target: { value: next } });
  fireEvent.click(screen.getByRole('button', { name: 'Abrir experiência' }));
  const dialog = await pending();
  expect(location.hostname).not.toBe('elsewhere.example');
  expect(saved()).toEqual(original);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Abrir e substituir' }));
  await waitFor(() => expect(saved()).toEqual(salon()));
  expect(location.pathname).toBe('/whats-demo/');
});
it('provides a selectable backup link when clipboard access is unavailable, including incomplete editable drafts', async () => {
  const original = bakery();
  original.steps = [
    {
      id: 'reply',
      type: 'business',
      text: '',
      delay: 1,
      interactive: { kind: 'buttons', buttons: [{ id: 'first', title: '' }], autoReplyId: 'first' },
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  history.replaceState(null, '', await incoming());
  await start();
  const dialog = await pending();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Copiar link do projeto atual' }));
  const backup = await screen.findByRole('dialog', { name: 'Link da experiência' });
  const field = within(backup).getByRole('textbox') as HTMLTextAreaElement;
  expect(await decode(new URL(field.value).hash)).toEqual(original);
  expect(saved()).toEqual(original);
});
it('ignores stale validation after a newer link has been validated', async () => {
  const original = bakery();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
  let finish!: (value: unknown) => void;
  const slow = new Promise((resolve) => {
    finish = resolve;
  });
  const realDecode = codec.decode;
  vi.spyOn(codec, 'decode').mockImplementation((hash) =>
    hash.includes('slow') ? slow : realDecode(hash),
  );
  history.replaceState(null, '', '#project=v1j.slow');
  await start();
  await navigate(await incoming());
  const dialog = await pending();
  await act(async () => {
    finish(project('Outdated link'));
  });
  expect(within(dialog).getByText('Cabeleireira Leila')).toBeInTheDocument();
  expect(screen.queryByText('Outdated link')).toBeNull();
  expect(saved()).toEqual(original);
});
it('does not ask to replace an identical saved experience', async () => {
  const original = bakery();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
  history.replaceState(null, '', await createURL(original, location.href));
  await start();
  await waitFor(() => expect(window.whatsappFakeFlows!.getState().ready).toBe(true));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(saved()).toEqual(original);
});
it.each([
  ['en', 'Could not open this experience', 'Open another experience?'],
  ['es', 'No se pudo abrir esta experiencia', '¿Abrir otra experiencia?'],
  ['pt-BR', 'Não foi possível abrir esta experiência', 'Abrir outra experiência?'],
])(
  'provides translated error and confirmation states in %s',
  async (language, title, confirmation) => {
    await i18n.changeLanguage(language);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bakery()));
    history.replaceState(null, '', '#project=v1j.a');
    await start();
    expect(await screen.findByRole('heading', { name: title })).toHaveFocus();
    await navigate(await incoming());
    expect(await screen.findByRole('dialog', { name: confirmation })).toBeInTheDocument();
  },
);
it('keeps the prominent error state accessible', async () => {
  history.replaceState(null, '', '#project=v1j.a');
  await start();
  await screen.findByRole('heading', { name: 'Não foi possível abrir esta experiência' });
  const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations).toEqual([]);
});

it('rejects decoded projects with an invalid schema before offering replacement', async () => {
  const original = bakery();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
  const invalid = {
    ...salon(),
    steps: [{ id: 'bad', type: 'business', text: 'Unsafe structure', delay: -1 }],
  };
  history.replaceState(
    null,
    '',
    '#project=v1j.' + Buffer.from(JSON.stringify(invalid)).toString('base64url'),
  );
  await start();
  await screen.findByRole('heading', { name: 'Não foi possível abrir esta experiência' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(saved()).toEqual(original);
});
it('ignores a slow result after continuing the current draft', async () => {
  const original = bakery();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(original));
  let finish!: (value: unknown) => void;
  vi.spyOn(codec, 'decode').mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  history.replaceState(null, '', '#project=v1j.slow');
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar meu rascunho' }));
  await act(async () => {
    finish(salon());
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Padaria do Seu Zé');
  expect(saved()).toEqual(original);
  expect(location.hash).toBe('');
});
