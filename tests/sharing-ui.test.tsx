// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { Blob as NativeBlob } from 'node:buffer';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createShareURL, decode, sharedRoute } from '../src/core/codec';
import { createLumaProject } from './fixtures/luma-project';
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

it('asks for a step before attempting to copy an empty journey', async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Copiar link' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Adicione pelo menos uma etapa');
  expect(write).not.toHaveBeenCalled();
});

it('copies one link from the keyboard and opens only Preview initially', async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const draft = JSON.stringify(createLumaProject());
  localStorage.setItem(STORAGE_KEY, draft);
  render(<App />);
  const trigger = screen.getByRole('button', { name: 'Copiar link' });
  trigger.focus();
  await user.keyboard('{Enter}');

  await screen.findByText('Link copiado.');
  expect(write).toHaveBeenCalledTimes(1);
  const copied = write.mock.calls[0][0];
  const fromWhatsApp = copied.replaceAll('_', '');
  expect(fromWhatsApp).toBe(copied);
  const url = new URL(fromWhatsApp);
  expect(sharedRoute(url.hash)).toMatchObject({
    mode: 'editor',
    previewOnly: true,
    locale: 'pt-BR',
    token: expect.stringMatching(/^v3z\.[A-Za-z0-9]+$/),
  });
  expect(await decode(url.hash)).toEqual(window.whatsappFakeFlows!.getProject());
  expect(screen.queryByRole('menu')).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(localStorage.getItem(STORAGE_KEY)).toBe(draft);
  expect(trigger).toHaveFocus();

  cleanup();
  history.replaceState(null, '', url.hash);
  render(<App />);
  const expandCode = await screen.findByRole('button', { name: 'Expandir Código' });
  const expandEditor = screen.getByRole('button', { name: 'Expandir Editor' });
  expect(expandCode).toHaveAttribute('aria-expanded', 'false');
  expect(expandEditor).toHaveAttribute('aria-expanded', 'false');
  expect(document.getElementById('workspace-code')).not.toBeVisible();
  expect(document.getElementById('workspace-editor')).not.toBeVisible();
  expect(document.getElementById('workspace-preview')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Iniciar manual' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: /Só celular/ })).toBeNull();

  const auto = screen.getByRole('button', { name: 'Reproduzir automaticamente' });
  const hint = await screen.findByRole('tooltip');
  expect(hint).toHaveTextContent('Selecione o botão de play para ver esta jornada do começo.');
  expect(auto).toHaveAttribute('aria-describedby', hint.id);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('tooltip')).toBeNull();
  await user.hover(auto);
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    'Executa a jornada com cursor e respostas animados.',
  );
  await user.unhover(auto);

  await user.click(expandEditor);
  await user.click(expandCode);
  expect(document.getElementById('workspace-editor')).toBeVisible();
  expect(document.getElementById('workspace-code')).toBeVisible();
  expect(document.getElementById('workspace-preview')).toBeVisible();

  cleanup();
  history.replaceState(null, '', url.hash);
  render(<App />);
  expect(await screen.findByRole('button', { name: 'Reproduzir automaticamente' })).toBeEnabled();
  expect(screen.queryByRole('tooltip')).toBeNull();
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
  const draft = JSON.stringify(createLumaProject());
  localStorage.setItem(STORAGE_KEY, draft);
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Copiar link' }));
  expect(write).toHaveBeenCalledTimes(1);
  expect(await (await clipboardData)?.text()).toMatch(
    /#editor=v3z\.[A-Za-z0-9]+&lang=pt-BR&view=preview$/,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível copiar o link.');
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('applies the link language in preview and its editable copy without changing the browser preference', async () => {
  const user = userEvent.setup();
  localStorage.setItem(LOCALE_KEY, 'en');
  const project = createLumaProject();
  project.contact.name = 'Empresa da jornada';
  const link = new URL(await createShareURL(project, 'demo', location.href, 'es'));
  history.replaceState(null, '', link.hash);
  render(<App />);
  const copy = await screen.findByRole('link', { name: 'Editar una copia' });
  expect(document.documentElement.lang).toBe('es');
  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    'Selecciona el botón de reproducción para ver este recorrido desde el principio.',
  );
  expect(screen.queryByRole('heading', { name: 'Crea la conversación' })).toBeNull();
  expect(localStorage.getItem(LOCALE_KEY)).toBe('en');
  await user.click(copy);
  expect(await screen.findByRole('heading', { name: 'Crea la conversación' })).toBeVisible();
  expect(document.documentElement.lang).toBe('es');
  expect(screen.getByTitle('Empresa da jornada')).toBeVisible();
  expect(localStorage.getItem(LOCALE_KEY)).toBe('en');
  await waitFor(() => expect(sharedRoute(location.hash)?.locale).toBe('es'));
});
