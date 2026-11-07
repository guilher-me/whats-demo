// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { decode, encode } from '../src/core/codec';
import { validateProject } from '../src/core/engine';
import { Blob as NativeBlob } from 'node:buffer';
import { STORAGE_KEY } from '../src/core/project';
import type { Project, Step } from '../src/core/types';

const voice: Step = { id: 'voice', type: 'user', text: '', delay: 0, voiceDurationSeconds: 2 };
const reply: Step = { id: 'reply', type: 'business', text: 'Obrigado!', delay: 0 };
const project = (steps: Step[]): Project => ({
  version: 1,
  contact: { name: 'Demo', verified: false },
  steps,
});
const api = () => window.whatsappFakeFlows!;
const microphone = () => screen.getByRole('button', { name: 'Segure para gravar' });

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers({
    toFake: ['performance', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function start(steps = [voice, reply]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project(steps)));
  render(<App />);
  await act(async () => {});
}
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

it('starts a manual voice step and sends on release using the time held', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  expect(microphone()).toHaveFocus();
  fireEvent.keyDown(microphone(), { key: ' ' });
  await tick(1350);
  expect(document.querySelector('.voice-recording')).toHaveTextContent('0:01');
  expect(api().getState().messages).toHaveLength(0);
  fireEvent.keyUp(microphone(), { key: ' ' });
  await tick(1);
  expect(screen.getByRole('img', { name: 'Mensagem de voz simulada · 0:01' })).toBeVisible();
  expect(api().getState().messages).toMatchObject([
    { direction: 'user', voiceDurationMs: 1350, receipt: 'read' },
    { direction: 'business', text: 'Obrigado!' },
  ]);
});

it('holds the cursor for the configured time, suspends the recording on pause and sends once', async () => {
  await start([voice]);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(1000);
  expect(document.querySelector('.touch-cursor')).toHaveClass('pressed');
  expect(document.querySelector('.voice-recording')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Pausar reprodução' }));
  await tick(1);
  const waveform = document.querySelector('.voice-recording')?.innerHTML;
  await tick(3000);
  expect(document.querySelector('.voice-recording')?.innerHTML).toBe(waveform);
  expect(api().getState().messages).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Continuar reprodução' }));
  await tick(1379);
  expect(api().getState().messages).toHaveLength(0);
  await tick(2);
  expect(api().getState().messages).toMatchObject([{ direction: 'user', voiceDurationMs: 2000 }]);
});

it('restores the text composer for the next automatic customer step', async () => {
  await start([voice, { id: 'text', type: 'user', text: 'Olá!', delay: 0 }]);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(6000);
  expect(api().getState().messages).toMatchObject([{ voiceDurationMs: 2000 }, { text: 'Olá!' }]);
  expect(api().getState().running).toBe(false);
});

it('cancels an automatic hold on reset and discards it before a new run', async () => {
  await start([voice]);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(500);
  fireEvent.click(screen.getByRole('button', { name: 'Reiniciar prévia' }));
  await tick(4000);
  expect(document.querySelector('.voice-recording')).toBeNull();
  expect(api().getState().messages).toHaveLength(0);
  fireEvent.keyDown(microphone(), { key: 'Enter' });
  await tick(1200);
  fireEvent.keyUp(microphone(), { key: 'Enter' });
  await tick(1);
  expect(api().getState().messages).toMatchObject([{ voiceDurationMs: 1200 }]);
});

it('round trips voice metadata in links and rejects invalid durations and senders', async () => {
  vi.stubGlobal('Blob', NativeBlob);
  try {
    expect(await decode(await encode(project([voice, reply])))).toEqual(project([voice, reply]));
    for (const seconds of [0, 1.5, 121, '2']) {
      expect(() =>
        validateProject(project([{ ...voice, voiceDurationSeconds: seconds } as Step])),
      ).toThrow();
    }
    expect(() => validateProject(project([{ ...voice, type: 'business' } as Step]))).toThrow();
  } finally {
    vi.unstubAllGlobals();
  }
});
