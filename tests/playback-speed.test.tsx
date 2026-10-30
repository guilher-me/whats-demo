// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { STORAGE_KEY } from '../src/core/project';
import { createDefaultProject } from '../src/core/defaults';
import { PLAYBACK_SPEED_KEY } from '../src/features/playback/hooks/usePlaybackSpeed';

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
async function start(fullExample = false) {
  const project = createDefaultProject();
  project.contact.avatar = '';
  if (!fullExample)
    project.steps = [
      { id: 'one', type: 'business', text: 'First message', delay: 6 },
      { id: 'two', type: 'business', text: 'Second message', delay: 6 },
    ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  const view = render(<App />);
  await act(async () => {});
  return view;
}
function chooseSpeed(index: number) {
  fireEvent.click(screen.getByRole('button', { name: 'Ritmo do usuário simulado' }));
  fireEvent.change(screen.getByRole('slider'), { target: { value: String(index) } });
}
it('persists the preference without changing the journey and closes with Escape', async () => {
  const view = await start();
  const before = window.whatsappFakeFlows!.getProject();
  chooseSpeed(3);
  expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '2×');
  expect(localStorage.getItem(PLAYBACK_SPEED_KEY)).toBe('2');
  expect(window.whatsappFakeFlows!.getProject()).toEqual(before);
  fireEvent.keyDown(screen.getByRole('slider'), { key: 'Escape' });
  const trigger = screen.getByRole('button', { name: 'Ritmo do usuário simulado' });
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveTextContent('2×');
  expect(screen.queryByRole('slider')).toBeNull();
  view.unmount();
  await start();
  expect(screen.getByRole('button', { name: 'Ritmo do usuário simulado' })).toHaveTextContent('2×');
});
it.each([
  ['Reproduzir automaticamente', 6000],
  ['Iniciar manual', 6000],
])('preserves configured system delays in both modes: %s', async (mode, milliseconds) => {
  localStorage.setItem(PLAYBACK_SPEED_KEY, '3');
  await start();
  fireEvent.click(screen.getByRole('button', { name: mode }));
  await tick(milliseconds - 1);
  expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
  await tick(1);
  expect(window.whatsappFakeFlows!.getState().messages.map((m) => m.text)).toEqual([
    'First message',
  ]);
  expect(document.querySelector('.phone-stage')).toHaveStyle({
    '--cursor-speed': mode === 'Iniciar manual' ? '1' : '3',
  });
});
it('slows down to 0.5x and cancels without late messages', async () => {
  localStorage.setItem(PLAYBACK_SPEED_KEY, '0.5');
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(5999);
  expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Reiniciar prévia' }));
  await tick(35000);
  expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
});
it('falls back to 1x for an unsupported saved value', async () => {
  localStorage.setItem(PLAYBACK_SPEED_KEY, '999');
  await start();
  expect(screen.getByRole('button', { name: 'Ritmo do usuário simulado' })).toHaveTextContent('1×');
});
it('finishes the full Luma journey with choices and both Flow screens at 3x', async () => {
  localStorage.setItem(PLAYBACK_SPEED_KEY, '3');
  await start(true);
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(35000);
  expect(window.whatsappFakeFlows!.getState().running).toBe(false);
  expect(document.querySelector('.play-status')).toHaveTextContent('Conversa concluída.');
  const messages = window.whatsappFakeFlows!.getState().messages;
  expect(messages.some((m) => m.text === 'Beam table lamp')).toBe(true);
  expect(messages.some((m) => m.text === 'Product request sent')).toBe(true);
  expect(messages.at(-1)?.text).toContain('LH-1042');
});
