// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { STORAGE_KEY } from '../src/core/project';
import type { Project } from '../src/core/types';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

async function openPreview() {
  vi.useFakeTimers();
  history.replaceState(null, '', '/');
  const project: Project = {
    version: 1,
    contact: { name: 'Loja exemplo', verified: false },
    steps: [
      {
        id: 'pix',
        type: 'business',
        text: 'Seu pedido',
        delay: 0,
        typing: false,
        commerce: { kind: 'pix', amount: { cents: 1234 } },
      },
      { id: 'next', type: 'business', text: 'Obrigado', delay: 0, typing: false },
    ],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
}

it.each(['Iniciar manual', 'Reproduzir automaticamente'])(
  'allows an immediate Pix tap, advances once and dismisses the notice in %s',
  async (mode) => {
    await openPreview();
    fireEvent.click(screen.getByRole('button', { name: mode }));
    await act(async () => vi.advanceTimersByTimeAsync(1));

    const copy = screen.getByRole('button', { name: 'Copiar código Pix' });
    expect(copy).toBeEnabled();
    fireEvent.click(copy);
    expect(screen.getByText('Chave Pix copiada')).toBeVisible();
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(window.whatsDemo!.getState().messages.at(-1)?.text).toBe('Obrigado');

    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(screen.queryByText('Chave Pix copiada')).toBeNull();
    expect(window.whatsDemo!.getState().messages.map(({ text }) => text)).toEqual([
      'Seu pedido',
      'Obrigado',
    ]);
  },
);

it('copies the Pix code with the automatic cursor when the viewer does not tap', async () => {
  await openPreview();
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await act(async () => vi.advanceTimersByTimeAsync(1800));
  expect(screen.getByText('Chave Pix copiada')).toBeVisible();
  expect(window.whatsDemo!.getState().messages.at(-1)?.text).toBe('Obrigado');
});
