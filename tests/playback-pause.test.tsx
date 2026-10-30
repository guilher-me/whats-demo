// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createDefaultProject } from '../src/core/defaults';
import { STORAGE_KEY } from '../src/core/project';
import type { Project } from '../src/core/types';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
async function start(steps: Project['steps']) {
  const project = createDefaultProject();
  project.contact.avatar = '';
  project.steps = steps;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
}
const pause = () => fireEvent.click(screen.getByRole('button', { name: 'Pausar reprodução' }));
const resume = () => fireEvent.click(screen.getByRole('button', { name: 'Continuar reprodução' }));
it.each(['Iniciar manual', 'Reproduzir automaticamente'])(
  'resumes a pending system reply with its remaining delay in %s',
  async (mode) => {
    await start([{ id: 'reply', type: 'business', text: 'Reply once', delay: 6 }]);
    fireEvent.click(screen.getByRole('button', { name: mode }));
    await tick(2000);
    pause();
    expect(document.querySelector('.play-status')).toHaveTextContent('Reprodução pausada.');
    expect(document.querySelector('#phone-preview')).toHaveAttribute('inert');
    await tick(20000);
    expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
    resume();
    await tick(3999);
    expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
    await tick(1);
    expect(window.whatsappFakeFlows!.getState().messages.map((m) => m.text)).toEqual([
      'Reply once',
    ]);
    await tick(5000);
    expect(window.whatsappFakeFlows!.getState().running).toBe(false);
  },
);
it('preserves a partly typed automatic message, then sends it exactly once', async () => {
  await start([{ id: 'hello', type: 'user', text: 'Hello there', delay: 0 }]);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(1000);
  const composer = screen.getByLabelText('Mensagem') as HTMLInputElement;
  const partial = composer.value;
  expect(partial.length).toBeGreaterThan(0);
  expect(partial.length).toBeLessThan('Hello there'.length);
  pause();
  await tick(30000);
  expect(composer.value).toBe(partial);
  expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
  resume();
  await tick(5000);
  expect(window.whatsappFakeFlows!.getState().messages.map((m) => m.text)).toEqual(['Hello there']);
});
it('retains the current Flow screen and partly filled field during automatic playback', async () => {
  const name = 'Alexandra Taylor Robertson';
  await start([
    {
      id: 'form',
      type: 'flow',
      text: 'Your details',
      delay: 0,
      label: 'Open',
      completion: 'Details sent',
      answers: { name },
      flow: {
        version: '7.3',
        screens: [
          {
            id: 'DETAILS',
            title: 'Details',
            terminal: true,
            layout: {
              type: 'SingleColumnLayout',
              children: [
                { type: 'TextInput', name: 'name', label: 'Full name', required: true },
                {
                  type: 'Footer',
                  label: 'Send',
                  'on-click-action': { name: 'complete', payload: {} },
                },
              ],
            },
          },
        ],
      },
    },
  ]);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  let field: HTMLInputElement | null = null;
  for (let attempt = 0; attempt < 150; attempt++) {
    await tick(100);
    field = document.querySelector<HTMLInputElement>('[data-field="name"]');
    if (field && field.value.length > 0 && field.value.length < name.length) break;
  }
  expect(field).not.toBeNull();
  const partial = field!.value;
  expect(partial.length).toBeGreaterThan(0);
  expect(partial.length).toBeLessThan(name.length);
  pause();
  await tick(30000);
  expect(field!.value).toBe(partial);
  expect(window.whatsappFakeFlows!.getState().flowScreen).toBe('DETAILS');
  resume();
  await tick(20000);
  expect(
    window.whatsappFakeFlows!.getState().messages.filter((m) => m.text === 'Details sent'),
  ).toHaveLength(1);
  expect(window.whatsappFakeFlows!.getState().running).toBe(false);
});
it('reset during a pause cancels the suspended run and a new run starts cleanly', async () => {
  await start([{ id: 'reply', type: 'business', text: 'New run', delay: 2 }]);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(500);
  pause();
  fireEvent.click(screen.getByRole('button', { name: 'Reiniciar prévia' }));
  await tick(30000);
  expect(window.whatsappFakeFlows!.getState().running).toBe(false);
  expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(6000);
  expect(window.whatsappFakeFlows!.getState().messages.map((m) => m.text)).toEqual(['New run']);
});
