// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { Blob as NativeBlob } from 'node:buffer';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createShareURL, decode, sharedRoute } from '../src/core/codec';
import { createDefaultProject } from '../src/core/defaults';
import { STORAGE_KEY } from '../src/core/project';
import { LOCALE_KEY } from '../src/i18n';

beforeEach(() => {
  history.replaceState(null, '', '/whats-demo/');
  localStorage.clear();
  vi.stubGlobal('Blob', NativeBlob);
  vi.stubGlobal('ClipboardItem', undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it.each([
  ['Editor', 'editor', '{Home}{Enter}'],
  ['Prévia', 'demo', '{End}{Enter}'],
])('copies the %s link from the keyboard without a dialog', async (label, mode, keys) => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  render(<App />);
  expect(screen.queryByRole('button', { name: 'Criar com IA' })).toBeNull();
  const trigger = screen.getByRole('button', { name: 'Copiar link' });
  trigger.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('menuitem', { name: label })).toBeVisible();
  await user.keyboard(keys);

  await screen.findByText('Link copiado.');
  expect(write).toHaveBeenCalledTimes(1);
  const copied = write.mock.calls[0][0];
  const fromWhatsApp = copied.replaceAll('_', '');
  expect(fromWhatsApp).toBe(copied);
  const url = new URL(fromWhatsApp);
  expect(sharedRoute(url.hash)).toMatchObject({
    mode,
    locale: 'pt-BR',
    token: expect.stringMatching(/^v3z\.[A-Za-z0-9]+$/),
  });
  expect(await decode(url.hash)).toEqual(window.whatsappFakeFlows!.getProject());
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  expect(trigger).toHaveFocus();
});

it('passes the promised URL to ClipboardItem and reports a blocked write inline', async () => {
  const user = userEvent.setup();
  let clipboardData: Promise<Blob> | undefined;
  vi.stubGlobal(
    'ClipboardItem',
    class {
      constructor(data: Record<string, Promise<Blob>>) {
        clipboardData = data['text/plain'];
      }
    },
  );
  const write = vi.spyOn(navigator.clipboard, 'write').mockRejectedValue(new Error('blocked'));
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Copiar link' }));
  await user.click(screen.getByRole('menuitem', { name: 'Editor' }));
  expect(write).toHaveBeenCalledTimes(1);
  expect(await (await clipboardData)?.text()).toContain('#editor=v3z.');
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível copiar o link.');
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('applies the link language in preview and its editable copy without changing the browser preference', async () => {
  const user = userEvent.setup();
  localStorage.setItem(LOCALE_KEY, 'en');
  const project = createDefaultProject();
  project.contact.name = 'Empresa da jornada';
  const link = new URL(await createShareURL(project, 'demo', location.href, 'es'));
  history.replaceState(null, '', link.hash);
  render(<App />);
  const copy = await screen.findByRole('link', { name: 'Editar una copia' });
  expect(document.documentElement.lang).toBe('es');
  expect(screen.queryByRole('heading', { name: 'Crea la conversación' })).toBeNull();
  expect(localStorage.getItem(LOCALE_KEY)).toBe('en');
  await user.click(copy);
  expect(await screen.findByRole('heading', { name: 'Crea la conversación' })).toBeVisible();
  expect(document.documentElement.lang).toBe('es');
  expect(screen.getByTitle('Empresa da jornada')).toBeVisible();
  expect(localStorage.getItem(LOCALE_KEY)).toBe('en');
  await waitFor(() => expect(sharedRoute(location.hash)?.locale).toBe('es'));
});
