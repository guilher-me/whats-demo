// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createDefaultProject } from '../src/core/defaults';
import { STORAGE_KEY } from '../src/core/project';
import { createURL } from '../src/core/codec';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function start() {
  render(<App />);
  await act(async () => {});
}
const indicator = () => document.querySelector('.save-indicator') as HTMLElement;
it('does not claim the untouched example is saved and separates sharing from storage', async () => {
  await start();
  expect(indicator()).toHaveAttribute('data-state', 'example');
  expect(indicator()).toHaveTextContent('Exemplo · não salvo');
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  expect(document.querySelector('.app-header .save-indicator')).toBeNull();
  expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
});
it('shows success only after writing and restores the saved draft on reopening', async () => {
  const project = createDefaultProject();
  project.contact.avatar = '';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  await start();
  fireEvent.change(screen.getByLabelText('Nome do contato'), {
    target: { value: 'Contato de teste' },
  });
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).contact.name).toBe('Contato de teste');
  expect(indicator()).toHaveAttribute('data-state', 'saved');
  expect(indicator()).toHaveTextContent('Salvo automaticamente');
  cleanup();
  await start();
  expect(indicator()).toHaveAttribute('data-state', 'recovered');
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Contato de teste');
  fireEvent.focus(indicator());
  expect(screen.getByRole('tooltip')).toHaveTextContent('Armazenado somente neste navegador.');
  fireEvent.keyDown(indicator(), { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).toBeNull();
});
it('reports a failed write visibly, keeps the edits, and clears the warning after a successful save', async () => {
  await start();
  const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  fireEvent.change(screen.getByLabelText('Nome do contato'), {
    target: { value: 'Alteração preservada' },
  });
  expect(indicator()).toHaveAttribute('data-state', 'failed');
  expect(screen.getByRole('alert')).toHaveTextContent('Copie o link da experiência');
  expect(screen.getByLabelText('Nome do contato')).toHaveValue('Alteração preservada');
  save.mockRestore();
  fireEvent.change(screen.getByLabelText('Nome do contato'), { target: { value: 'Agora salvo' } });
  expect(indicator()).toHaveAttribute('data-state', 'saved');
  expect(screen.queryByRole('alert')).toBeNull();
});
it('does not treat a shared-link load as a successful local save', async () => {
  vi.stubGlobal('CompressionStream', undefined);
  const project = createDefaultProject();
  project.contact.avatar = '';
  history.replaceState(null, '', await createURL(project, location.href));
  await start();
  expect(indicator()).toHaveAttribute('data-state', 'shared');
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
});
