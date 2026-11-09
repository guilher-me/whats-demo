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

it('advances the journey on a single Pix tap and dismisses the copy notice', async () => {
  vi.useFakeTimers();
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
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await act(async () => vi.advanceTimersByTimeAsync(1));

  fireEvent.click(screen.getByRole('button', { name: 'Copiar código Pix' }));
  expect(screen.getByText('Chave Pix copiada')).toBeVisible();
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => vi.advanceTimersByTimeAsync(1));
  expect(window.whatsDemo!.getState().messages.at(-1)?.text).toBe('Obrigado');

  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(screen.queryByText('Chave Pix copiada')).toBeNull();
});
