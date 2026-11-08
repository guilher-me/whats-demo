// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { savedJourney } from './fixtures/journey-library';
import { createLumaProject } from './fixtures/luma-project';
import { STORAGE_KEY } from '../src/core/project';
import { createShareURL } from '../src/core/codec';
import { Blob as NativeBlob } from 'node:buffer';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
async function start() {
  render(<App />);
  await act(async () => {});
}
const indicator = () => document.querySelector('.save-indicator') as HTMLElement;
it('keeps development edits separate from the existing production draft', async () => {
  const production = createLumaProject();
  production.contact.name = 'Production contact';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(production));
  history.replaceState(null, '', '/whats-demo/development/');
  await start();
  expect(screen.getByLabelText('Nome do contato')).not.toHaveValue('Production contact');
  fireEvent.change(screen.getByLabelText('Nome do contato'), {
    target: { value: 'Development contact' },
  });
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).contact.name).toBe('Production contact');
  expect(savedJourney()?.project.contact.name).toBe('Development contact');
  cleanup();
  history.replaceState(null, '', '/whats-demo/');
  await start();
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Production contact');
});
it('does not claim the untouched empty editor is saved and separates sharing from storage', async () => {
  await start();
  expect(indicator()).toHaveAttribute('data-state', 'empty');
  expect(indicator()).toHaveTextContent('Nova jornada · não salva');
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  expect(window.whatsappFakeFlows!.getProject().steps).toEqual([]);
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('');
  expect(screen.queryByRole('button', { name: 'Restaurar do link' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Restaurar exemplo' })).toBeNull();
  expect(document.querySelector('.app-header .brand-meta .save-indicator')).toBe(indicator());
  expect(document.querySelector('.editor .save-indicator')).toBeNull();
  expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
});
it('writes immediately, then shows success after the last edit settles', async () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(createLumaProject()));
  await start();
  vi.useFakeTimers();
  const input = screen.getByLabelText('Nome do contato');
  fireEvent.change(input, { target: { value: 'Contato' } });
  expect(savedJourney()?.project.contact.name).toBe('Contato');
  expect(indicator()).toHaveAttribute('data-state', 'saving');
  await act(() => vi.advanceTimersByTimeAsync(450));
  fireEvent.change(input, { target: { value: 'Contato de teste' } });
  expect(savedJourney()?.project.contact.name).toBe('Contato de teste');
  await act(() => vi.advanceTimersByTimeAsync(699));
  expect(indicator()).toHaveAttribute('data-state', 'saving');
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(indicator()).toHaveAttribute('data-state', 'saved');
  expect(indicator()).toHaveTextContent('Todas as alterações salvas');
  cleanup();
  await start();
  expect(indicator()).toHaveAttribute('data-state', 'recovered');
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Contato de teste');
  fireEvent.focus(indicator());
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    'Salvo somente neste navegador, incluindo o perfil do contato e toda a conversa.',
  );
  fireEvent.keyDown(indicator(), { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).toBeNull();
});
it('reports a failed write visibly, keeps the edits, and clears the warning after a successful save', async () => {
  await start();
  vi.useFakeTimers();
  const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  fireEvent.change(screen.getByLabelText('Nome do contato'), {
    target: { value: 'Alteração preservada' },
  });
  expect(indicator()).toHaveAttribute('data-state', 'failed');
  expect(screen.getByRole('alert')).toHaveTextContent('Copie um link');
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Alteração preservada');
  save.mockRestore();
  fireEvent.change(screen.getByLabelText('Nome do contato'), { target: { value: 'Agora salvo' } });
  expect(indicator()).toHaveAttribute('data-state', 'saving');
  await act(() => vi.advanceTimersByTimeAsync(700));
  expect(indicator()).toHaveAttribute('data-state', 'saved');
  expect(screen.queryByRole('alert')).toBeNull();
});
function oneMessageProject(name: string) {
  return {
    version: 1,
    contact: { name, verified: false },
    steps: [{ id: 'hello', type: 'business', text: 'Olá!', delay: 0 }],
  };
}
it('opens a shared copy separately, saves its edits and keeps the original snapshot', async () => {
  vi.stubGlobal('Blob', NativeBlob);
  const draft = oneMessageProject('Rascunho original');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  const project = oneMessageProject('Jornada compartilhada');
  const editor = new URL(await createShareURL(project, 'editor', location.href));
  history.replaceState(null, '', editor.hash);
  await start();
  const name = await screen.findByLabelText('Nome do contato');
  expect(name).toHaveValue('Jornada compartilhada');
  expect(indicator()).toHaveAttribute('data-state', 'shared');
  vi.useFakeTimers();
  fireEvent.change(name, { target: { value: 'Cópia editada' } });
  await act(() => vi.advanceTimersByTimeAsync(700));
  expect(indicator()).toHaveAttribute('data-state', 'saved');
  vi.useRealTimers();
  expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(draft));

  cleanup();
  history.replaceState(null, '', editor.hash.replace('#editor=', '#demo='));
  await start();
  expect(await screen.findByTitle('Jornada compartilhada')).toBeVisible();
  expect(screen.queryByLabelText('Nome do contato')).toBeNull();
  expect(screen.getByRole('link', { name: 'Editar uma cópia' })).toHaveAttribute(
    'href',
    editor.hash,
  );
  expect(window.whatsappFakeFlows).toBeUndefined();

  cleanup();
  history.replaceState(null, '', editor.hash);
  await start();
  expect(await screen.findByLabelText('Nome do contato')).toHaveValue('Cópia editada');
});

it('restores the journey from the link while keeping the main draft', async () => {
  vi.stubGlobal('Blob', NativeBlob);
  const draft = oneMessageProject('Rascunho original');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  const project = oneMessageProject('Jornada compartilhada');
  const link = new URL(await createShareURL(project, 'editor', location.href));
  history.replaceState(null, '', link.hash);
  await start();
  const name = await screen.findByLabelText('Nome do contato');
  fireEvent.change(name, { target: { value: 'Cópia editada' } });

  fireEvent.click(screen.getByRole('button', { name: 'Restaurar do link' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Restaurar do link' }));
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Jornada compartilhada');
  expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(draft));
});

it('migrates a legacy link draft alongside the primary journey', async () => {
  vi.stubGlobal('Blob', NativeBlob);
  const main = oneMessageProject('Rascunho original');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(main));
  const link = new URL(await createShareURL(oneMessageProject('Do link'), 'editor', location.href));
  const token = link.hash.slice('#editor='.length).split('&')[0];
  localStorage.setItem(
    STORAGE_KEY + ':copy:' + token,
    JSON.stringify(oneMessageProject('Cópia antiga')),
  );
  history.replaceState(null, '', link.hash);
  await start();
  expect(await screen.findByLabelText('Nome do contato')).toHaveValue('Cópia antiga');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Minhas jornadas' }), { key: 'Enter' });
  expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);
  expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(main));
});

it('reopens the same shared address after creating a different local journey', async () => {
  vi.stubGlobal('Blob', NativeBlob);
  const link = new URL(await createShareURL(oneMessageProject('Do link'), 'editor', location.href));
  history.replaceState(null, '', link.hash);
  await start();
  expect(await screen.findByLabelText('Nome do contato')).toHaveValue('Do link');
  fireEvent.click(screen.getByRole('button', { name: /Nova jornada/ }));
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('');

  history.replaceState(null, '', link.hash);
  await act(async () => window.dispatchEvent(new HashChangeEvent('hashchange')));
  expect(await screen.findByLabelText('Nome do contato')).toHaveValue('Do link');
});

it('reports a truncated share link and preserves the local draft', async () => {
  const draft = createLumaProject();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  // Base62 for the first byte of a zlib stream, with the rest missing.
  history.replaceState(null, '', '#demo=v3z.1w');
  await start();
  expect(await screen.findByRole('alert')).toHaveTextContent('corrompido');
  expect(screen.getByRole('link', { name: 'Abrir meu editor' })).toBeVisible();
  expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(draft));
});
