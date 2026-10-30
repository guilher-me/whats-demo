// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { Blob as NativeBlob } from 'node:buffer';
import { App } from '../src/app/App';
import type { AutomationState } from '../src/features/automation/api';
beforeEach(() => {
  vi.stubGlobal('Blob', NativeBlob);
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  vi.useRealTimers();
});
it('carrega e reproduz o exemplo completo da documentação sem cliques', async () => {
  render(<App />);
  await act(async () => {});
  const api = window.whatsappFakeFlows!;
  expect(api.getState().ready).toBe(true);
  const guide = readFileSync('docs/automation.md', 'utf8');
  const script = /```js\n([\s\S]*?)```/.exec(guide)?.[1];
  expect(script).toBeTruthy();
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  let completion!: Promise<{ result: AutomationState; shareURL: string }>;
  act(() => {
    completion = new AsyncFunction('window', script + '\nreturn {result, shareURL};')(window);
  });
  expect(screen.getByTitle('Empresa exemplo')).toBeInTheDocument();
  expect(api.getState().running).toBe(true);
  for (let i = 0; i < 40; i++)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
  const output = await completion;
  expect(output.result.running).toBe(false);
  expect(output.result.status).toBe('Conversa concluída.');
  expect(document.querySelector('.messages')).toHaveTextContent('Seu protocolo de exemplo');
  expect(output.shareURL).toContain('#project=v1');
  expect(api.getProject().steps).toHaveLength(4);
  expect(JSON.parse(localStorage.getItem('whatsapp-fake-flows-v1')!)).toEqual(api.getProject());
});
it('atualiza o editor imediatamente, limpa a prévia e remove a API ao desmontar', async () => {
  render(<App />);
  await act(async () => {});
  const api = window.whatsappFakeFlows!;
  const project = {
    version: 1,
    contact: { name: 'API teste', avatar: '', verified: false },
    steps: [{ id: 'a', type: 'business', text: 'Olá pela API', delay: 0 }],
  };
  act(() => {
    api.loadProject(project);
  });
  expect(api.getProject()).toEqual(project);
  let run!: Promise<AutomationState>;
  act(() => {
    run = api.play();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  await run;
  expect(document.querySelector('.messages')).toHaveTextContent('Olá pela API');
  act(() => {
    api.reset();
  });
  expect(document.querySelectorAll('.bubble')).toHaveLength(0);
  expect(api.getProject()).toEqual(project);
  cleanup();
  expect(window.whatsappFakeFlows).toBeUndefined();
});
