// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { STORAGE_KEY } from '../src/core/project';
import type { Project } from '../src/core/types';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

it('inserts an earlier response at the caret and resolves manual and example values independently', async () => {
  vi.useFakeTimers();
  history.replaceState(null, '', '/');
  const project: Project = {
    version: 1,
    contact: { name: 'Loja', verified: false },
    steps: [
      { id: 'pergunta', type: 'user', delay: 0, text: 'Ana' },
      { id: 'reply', type: 'business', delay: 0, typing: false, text: 'Olá, !' },
    ],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});

  const step = screen.getByRole('article', { name: 'Etapa 2' });
  expect(step.querySelector('.step-id')).toHaveTextContent('reply');
  fireEvent.click(step);
  const text = within(step).getByRole('textbox') as HTMLTextAreaElement;
  text.focus();
  text.setSelectionRange(5, 5);
  fireEvent.click(within(step).getByRole('button', { name: 'Inserir variável' }));
  expect(within(step).getByText('Exemplo: Ana')).toBeVisible();
  expect(within(step).getByText('pergunta')).toBeVisible();
  fireEvent.keyDown(text, { key: 'Enter' });
  expect(text).toHaveValue('Olá, {{chat.pergunta.text}}!');
  expect(text.selectionStart).toBe(text.value.length - 1);
  expect(screen.getByText('Olá, Ana!')).toBeVisible();

  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await act(async () => vi.advanceTimersByTimeAsync(1));
  fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: '<Bea>' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
  await act(async () => vi.advanceTimersByTimeAsync(1));
  expect(screen.getByText('Olá, <Bea>!')).toBeVisible();
  expect(window.whatsDemo!.getProject().steps[1].text).toBe('Olá, {{chat.pergunta.text}}!');
  expect(window.whatsDemo!.getState().messages.at(-1)?.text).toBe('Olá, <Bea>!');
});
