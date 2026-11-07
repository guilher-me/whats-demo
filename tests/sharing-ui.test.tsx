// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { Blob as NativeBlob } from 'node:buffer';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { decode } from '../src/core/codec';
import { STORAGE_KEY } from '../src/core/project';

beforeEach(() => {
  history.replaceState(null, '', '/whats-demo/');
  localStorage.clear();
  vi.stubGlobal('Blob', NativeBlob);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('offers two share modes from the keyboard and copies a validated snapshot', async () => {
  const user = userEvent.setup();
  render(<App />);
  const trigger = screen.getByRole('button', { name: 'Copiar link' });
  trigger.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('menuitem', { name: 'Modo demo' })).toBeVisible();
  expect(screen.getByRole('menuitem', { name: 'Modo editor' })).toBeVisible();
  await user.keyboard('{ArrowDown}{Enter}');
  const dialog = within(await screen.findByRole('dialog'));
  const input = await dialog.findByRole<HTMLInputElement>('textbox', {
    name: 'Link de compartilhamento',
  });
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  await user.click(dialog.getByRole('button', { name: 'Copiar link' }));
  expect(write).toHaveBeenCalledWith(input.value);
  expect(new URL(input.value).hash).toMatch(/^#(?:demo|editor)=v2z\./);
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(trigger).toHaveFocus());
});

it('generates an AI link from pasted configuration without replacing the draft', async () => {
  const user = userEvent.setup();
  render(<App />);
  const api = window.whatsappFakeFlows!;
  const existing = api.getProject();
  await user.click(screen.getByRole('button', { name: 'Criar com IA' }));
  const dialog = within(screen.getByRole('dialog'));
  const input = dialog.getByRole('textbox', { name: 'Configuração da jornada' });
  await user.click(input);
  await user.paste('{invalid}');
  await user.click(dialog.getByRole('button', { name: 'Gerar link' }));
  expect(await dialog.findByRole('alert')).toHaveTextContent('configuração de jornada válida');
  await user.clear(input);
  const candidate = { ...existing, contact: { ...existing.contact, name: 'Loja da IA' } };
  await user.click(input);
  await user.paste(JSON.stringify(candidate));
  await user.selectOptions(dialog.getByRole('combobox'), 'editor');
  await user.click(dialog.getByRole('button', { name: 'Gerar link' }));
  const link = await dialog.findByRole<HTMLInputElement>('textbox', {
    name: 'Link de compartilhamento',
  });
  const { hash } = new URL(link.value);
  expect(hash).toMatch(/^#editor=v2z\./);
  expect(await decode(hash)).toEqual(candidate);
  expect(api.getProject()).toEqual(existing);
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
});
