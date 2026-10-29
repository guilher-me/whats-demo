// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { STORAGE_KEY } from '../src/core/project';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('mantém entregue ao enviar e marca visualizada quando a empresa responde', async () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      contact: { name: 'Empresa teste', avatar: '', verified: false },
      steps: [
        { id: 'user', type: 'user', text: 'oi', delay: 0 },
        { id: 'reply', type: 'business', text: 'Olá', delay: 1 },
      ],
    }),
  );
  render(<App />);
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: 'oi' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(screen.getByRole('img', { name: 'Mensagem entregue' })).not.toHaveClass(
    'message-receipt--read',
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(screen.getByRole('img', { name: 'Mensagem visualizada' })).toHaveClass(
    'message-receipt--read',
  );
  expect(screen.queryByRole('img', { name: 'Mensagem entregue' })).toBeNull();
  expect(window.whatsappFakeFlows!.getState().messages[0].receipt).toBe('read');
});
