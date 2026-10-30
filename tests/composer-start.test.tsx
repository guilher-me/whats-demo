// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { STORAGE_KEY } from '../src/core/project';
import type { Step } from '../src/core/types';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function start(steps: Step[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, contact: { name: 'Demo', avatar: '', verified: false }, steps }),
  );
  render(<App />);
  await act(async () => {});
}
async function tick(ms = 1) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
function send(text: string) {
  fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: text } });
  fireEvent.submit(screen.getByRole('form', { name: 'Enviar mensagem do cliente' }));
}
const state = () => window.whatsappFakeFlows!.getState();
it('can start a new manual conversation after automatic playback has finished', async () => {
  await start([{ id: 'hello', type: 'user', text: 'oi', delay: 0 }]);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(6000);
  expect(state().running).toBe(false);
  expect(screen.getByLabelText('Mensagem')).toBeEnabled();
  send('A new manual conversation');
  await tick();
  expect(state().messages.map((m) => m.text)).toEqual(['A new manual conversation']);
});
it('starts manual playback on submit, preserves the configured journey and never duplicates its opening message', async () => {
  await start([
    { id: 'hello', type: 'user', text: 'Configured greeting', delay: 30 },
    { id: 'reply', type: 'business', text: 'How can we help?', delay: 1 },
    { id: 'answer', type: 'user', text: 'Configured answer', delay: 0 },
    { id: 'done', type: 'business', text: 'Thank you!', delay: 0 },
  ]);
  send('  Hello from the composer  ');
  fireEvent.submit(screen.getByRole('form', { name: 'Enviar mensagem do cliente' }));
  expect(state().running).toBe(true);
  expect(state().messages.map((m) => m.text)).toEqual(['Hello from the composer']);
  expect(screen.getByLabelText('Mensagem')).toHaveValue('');
  await tick(1001);
  expect(state().messages.map((m) => m.text)).toEqual([
    'Hello from the composer',
    'How can we help?',
  ]);
  expect(state().running).toBe(true);
  send('My next reply');
  await tick();
  expect(state().messages.map((m) => m.text)).toEqual([
    'Hello from the composer',
    'How can we help?',
    'My next reply',
    'Thank you!',
  ]);
  expect(state().running).toBe(false);
  expect(window.whatsappFakeFlows!.getProject().steps[0].text).toBe('Configured greeting');
});
it('retains every configured step when the journey starts with a business message', async () => {
  await start([
    { id: 'welcome', type: 'business', text: 'Welcome!', delay: 0 },
    { id: 'answer', type: 'user', text: 'Your choice', delay: 0 },
  ]);
  send('Hello');
  await tick();
  expect(state().messages.map((m) => m.text)).toEqual(['Hello', 'Welcome!']);
  expect(state().activeStep).toBe('answer');
  expect(state().running).toBe(true);
});
it('ignores blank submissions and prevents typing or submitting during automatic playback', async () => {
  await start([{ id: 'hello', type: 'user', text: 'Automatic message', delay: 10 }]);
  send('   ');
  expect(state().running).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  expect(screen.getByLabelText('Mensagem')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('form', { name: 'Enviar mensagem do cliente' }));
  expect(state().messages).toHaveLength(0);
});
