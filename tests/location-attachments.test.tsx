// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Blob as NativeBlob } from 'node:buffer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createShareURL, loadSharedProject, sharedRoute } from '../src/core/codec';
import { normalizeProject } from '../src/core/project';
import type { Project } from '../src/core/types';

function journey(): Project {
  return {
    version: 1,
    contact: { name: 'Oficina', verified: false },
    steps: [
      {
        id: 'pickup',
        type: 'user',
        text: '',
        delay: 0,
        media: { kind: 'location', place: { name: 'Minha localização' } },
      },
      {
        id: 'shop',
        type: 'business',
        text: '',
        delay: 1,
        typing: false,
        media: { kind: 'location', place: { name: 'Oficina da demo', address: 'Rua Exemplo, 10' } },
      },
    ],
  };
}

const api = () => window.whatsappFakeFlows!;
const button = (name: string) => screen.getByRole('button', { name });
const dialog = () => within(screen.getByRole('dialog'));
const tick = (milliseconds: number) => act(async () => vi.advanceTimersByTimeAsync(milliseconds));

async function load() {
  render(<App />);
  await act(async () => api().loadProject(journey()));
}

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('keeps the location step pending after back or close and records the point actually chosen', async () => {
  await load();
  vi.useFakeTimers();
  fireEvent.click(button('Anexar'));
  fireEvent.click(dialog().getByRole('button', { name: 'Localização' }));
  expect(dialog().getByRole('button', { name: /Enviar minha localização atual/ })).toBeEnabled();
  fireEvent.click(dialog().getByRole('button', { name: 'Voltar' }));
  fireEvent.click(dialog().getByRole('button', { name: 'Localização' }));
  fireEvent.click(dialog().getByRole('button', { name: 'Fechar diálogo' }));
  expect(api().getState()).toMatchObject({ running: true, activeStep: 'pickup', messages: [] });

  fireEvent.click(button('Anexar'));
  fireEvent.click(dialog().getByRole('button', { name: 'Localização' }));
  fireEvent.click(dialog().getByRole('button', { name: /Oficina da demo/ }));
  expect(api().getState().messages[0]).toMatchObject({
    direction: 'user',
    attachmentId: 'media:shop',
    location: { name: 'Oficina da demo', address: 'Rua Exemplo, 10' },
  });
  await tick(999);
  expect(api().getState().messages).toHaveLength(1);
  await tick(1);
  expect(api().getState().messages[1]).toMatchObject({
    direction: 'business',
    location: { name: 'Oficina da demo', address: 'Rua Exemplo, 10' },
  });
  const customer = document.querySelector<HTMLElement>('.bubble.user')!;
  fireEvent.click(within(customer).getByRole('button', { name: 'Oficina da demo' }));
  expect(dialog().getByText('Rua Exemplo, 10')).toBeVisible();
  expect(dialog().getByText('Localização simulada')).toBeVisible();
});

it('pauses on the location screen, resets cleanly, then sends the configured point in automatic mode', async () => {
  await load();
  vi.useFakeTimers();
  const start = () => fireEvent.click(button('Reproduzir automaticamente'));
  start();
  await tick(1300);
  expect(screen.getByRole('dialog', { name: 'Enviar localização' })).toBeVisible();
  fireEvent.click(button('Pausar reprodução'));
  await tick(4000);
  expect(
    screen.getByRole('dialog', { name: 'Enviar localização', hidden: true }),
  ).toBeInTheDocument();
  expect(api().getState().messages).toHaveLength(0);
  fireEvent.click(button('Reiniciar prévia'));
  await tick(4000);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(api().getState().messages).toHaveLength(0);

  start();
  await tick(8000);
  expect(api().getState().messages[0]).toMatchObject({
    attachmentId: 'media:pickup',
    location: { name: 'Minha localização' },
  });
  expect(api().getState().running).toBe(false);
});

it('keeps an incomplete location draft and rejects it for sharing and playback', async () => {
  const project = journey();
  project.steps[0] = {
    id: 'draft',
    type: 'user',
    delay: 0,
    text: '',
    media: { kind: 'location', place: { name: ' ' } },
  };
  expect(normalizeProject(project, { allowDrafts: true })).toEqual(project);
  expect(() => normalizeProject(project)).toThrow('Informe o nome do local');
  await expect(createShareURL(project)).rejects.toThrow('Informe o nome do local');
  for (const place of [
    { name: 'A', address: 'a'.repeat(161) },
    { name: 'A', latitude: 0 },
  ]) {
    const invalid = {
      ...project,
      steps: [{ ...project.steps[0], media: { kind: 'location', place } }],
    };
    expect(() => normalizeProject(invalid)).toThrow();
  }
});

it('round-trips location metadata through a shared link', async () => {
  vi.stubGlobal('Blob', NativeBlob);
  const project = journey();
  const link = await createShareURL(project, 'editor', 'https://example.test/', 'pt-BR', 'preview');
  expect(await loadSharedProject(sharedRoute(new URL(link).hash)!)).toEqual(project);
});
