// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import storeIcon from '../assets/whatsapp-store.svg';
import { conversationAttachments } from '../src/core/attachments';
import { normalizeProject } from '../src/core/project';
import { STORAGE_KEY } from '../src/core/project';
import type { Attachment, Project } from '../src/core/types';

const images: Attachment[] = ['A', 'B', 'C'].map((id) => ({
  id,
  name: `Foto ${id}`,
  kind: 'image',
}));
const documentItem: Attachment = {
  id: 'pdf',
  name: 'Orçamento.pdf',
  kind: 'document',
  sizeLabel: '240 KB',
};
function project(): Project {
  return {
    version: 1,
    contact: { name: 'Oficina', verified: false },
    attachments: [...images, documentItem],
    steps: [
      {
        id: 'customer-image',
        type: 'user',
        text: '',
        delay: 0,
        media: {
          kind: 'image',
          attachmentId: 'A',
          alternativeIds: ['B'],
          caption: 'Legenda automática',
        },
      },
      {
        id: 'business-document',
        type: 'business',
        text: '',
        delay: 0,
        media: { kind: 'document', attachmentId: 'pdf' },
      },
      {
        id: 'business-image',
        type: 'business',
        text: '',
        delay: 0,
        media: { kind: 'image', attachmentId: 'C', caption: 'Foto da empresa' },
      },
      {
        id: 'image-reused',
        type: 'business',
        text: '',
        delay: 0,
        media: { kind: 'image', attachmentId: 'A', caption: 'Outra legenda' },
      },
    ],
  };
}
const api = () => window.whatsappFakeFlows!;
const button = (name: string) => screen.getByRole('button', { name });
const sheet = () => within(screen.getByRole('dialog'));
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function load() {
  render(<App />);
  await act(async () => {
    api().loadProject(project());
  });
}

it('lets the manual customer choose any visible photo, keeps the gallery and shows the company document', async () => {
  await load();
  vi.useFakeTimers();
  fireEvent.click(button('Anexar'));
  fireEvent.click(sheet().getByRole('button', { name: 'Galeria' }));
  expect(screen.getByRole('dialog', { name: 'Recentes' })).toBeVisible();
  expect(sheet().getAllByRole('button', { name: /Foto [ABC]/ })).toHaveLength(3);
  expect(sheet().queryByLabelText('Legenda (opcional)')).toBeNull();
  const photoB = sheet().getByRole('button', { name: 'Foto B' });
  fireEvent.click(photoB);
  expect(photoB).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(photoB);
  expect(photoB).toHaveAttribute('aria-pressed', 'false');
  expect(sheet().queryByRole('button', { name: 'Enviar mensagem' })).toBeNull();
  fireEvent.click(photoB);
  fireEvent.change(sheet().getByLabelText('Legenda (opcional)'), { target: { value: 'Rascunho' } });
  fireEvent.click(sheet().getByRole('button', { name: 'Revisar foto' }));
  expect(screen.getByRole('dialog', { name: 'Prévia do anexo' })).toBeVisible();
  expect(sheet().getByText('Foto B')).toBeVisible();
  fireEvent.click(sheet().getByRole('button', { name: 'Voltar' }));
  expect(sheet().getByLabelText('Legenda (opcional)')).toHaveValue('Rascunho');
  expect(sheet().getByRole('button', { name: 'Foto B' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(sheet().getByRole('button', { name: 'Foto C' }));
  expect(sheet().getByRole('button', { name: 'Foto B' })).toHaveAttribute('aria-pressed', 'false');
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(api().getState().messages).toHaveLength(0);
  fireEvent.click(button('Anexar'));
  fireEvent.click(sheet().getByRole('button', { name: 'Galeria' }));
  fireEvent.click(sheet().getByRole('button', { name: 'Foto C' }));
  expect(sheet().getByLabelText('Legenda (opcional)')).toHaveValue('');
  fireEvent.change(sheet().getByLabelText('Legenda (opcional)'), {
    target: { value: 'Minha foto' },
  });
  fireEvent.click(sheet().getByRole('button', { name: 'Enviar mensagem' }));
  await tick(300);
  expect(api().getState().messages).toMatchObject([
    { attachmentId: 'C', text: 'Minha foto', direction: 'user' },
    { attachmentId: 'pdf', direction: 'business' },
    { attachmentId: 'C', text: 'Foto da empresa' },
    { attachmentId: 'A', text: 'Outra legenda' },
  ]);
  expect(api().getProject().attachments).toHaveLength(4);
  fireEvent.click(button('Orçamento.pdf'));
  expect(sheet().getByText('Documento simulado · 240 KB')).toBeVisible();
});

it('animates the authored selection and caption, preserves the picker on pause and cancels on reset', async () => {
  await load();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  fireEvent.click(button('Reproduzir automaticamente'));
  await tick(1350);
  expect(sheet().getByRole('button', { name: 'Foto A' })).toBeVisible();
  fireEvent.click(button('Pausar reprodução'));
  await tick(5000);
  expect(api().getState().messages).toHaveLength(0);
  expect(sheet().getByRole('button', { name: 'Foto A' })).toBeVisible();
  fireEvent.click(button('Continuar reprodução'));
  await tick(8000);
  expect(api().getState().messages).toMatchObject([
    { attachmentId: 'A', text: 'Legenda automática' },
    { attachmentId: 'pdf' },
    { attachmentId: 'C', text: 'Foto da empresa' },
    { attachmentId: 'A', text: 'Outra legenda' },
  ]);
  fireEvent.click(button('Reproduzir automaticamente'));
  await tick(1350);
  fireEvent.click(button('Reiniciar prévia'));
  await tick(8000);
  expect(api().getState().messages).toHaveLength(0);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('creates a simulated document in a business step without files or an attachment library', () => {
  render(<App />);
  act(() => {
    api().loadProject({
      version: 1,
      contact: { name: 'Oficina', verified: false },
      steps: [{ id: 'business', type: 'business', text: 'Olá', delay: 0 }],
    });
  });
  fireEvent.click(screen.getByRole('radio', { name: 'Documento' }));
  expect(button('Iniciar manual')).toBeDisabled();
  fireEvent.click(button('Escolher dos anexos'));
  expect(screen.getByRole('dialog', { name: 'Criar documento simulado' })).toBeVisible();
  fireEvent.change(sheet().getByLabelText('Nome do arquivo'), { target: { value: 'Recibo.pdf' } });
  fireEvent.change(sheet().getByLabelText('Tamanho exibido'), { target: { value: '18 KB' } });
  fireEvent.click(sheet().getByRole('button', { name: 'Salvar anexo' }));
  const item = api().getProject().attachments?.[0];
  expect(item).toMatchObject({ kind: 'document', sizeLabel: '18 KB' });
  expect(api().getProject().steps[0]).toMatchObject({ media: { attachmentId: item?.id } });
  expect(screen.queryByRole('button', { name: /Anexos da conversa/ })).toBeNull();
  expect(document.querySelector('input[type="file"]')).toBeNull();
});

it('creates three previews in one step, switches the automatic choice and prunes a removed alternative', async () => {
  const candidate = project();
  candidate.attachments = [];
  candidate.steps = [{ id: 'image', type: 'user', text: '', delay: 0 }];
  render(<App />);
  act(() => {
    api().loadProject(candidate);
  });
  const format = screen.getByRole('combobox', { name: 'Formato da mensagem' });
  fireEvent.keyDown(format, { key: 'ArrowDown' });
  fireEvent.click(screen.getByRole('option', { name: 'Imagem' }));
  fireEvent.click(button('Escolher dos anexos'));
  expect(screen.getByRole('dialog', { name: 'Criar imagem simulada' })).toBeVisible();
  fireEvent.click(sheet().getByRole('button', { name: 'Salvar anexo' }));
  for (const name of ['IMG 02', 'IMG 03']) {
    fireEvent.click(button('Adicionar opção manual'));
    expect(sheet().getByPlaceholderText(name)).toBeVisible();
    fireEvent.click(sheet().getByRole('button', { name: 'Salvar anexo' }));
  }
  const items = conversationAttachments(api().getProject());
  expect(items.map((item) => item.name)).toEqual(['IMG 01', 'IMG 02', 'IMG 03']);
  fireEvent.click(button('Usar IMG 03 no automático'));
  expect(api().getProject().steps[0]).toMatchObject({ media: { attachmentId: items[2].id } });
  fireEvent.click(button('Remover IMG 02 desta etapa'));
  expect(conversationAttachments(api().getProject()).map((item) => item.name)).toEqual([
    'IMG 03',
    'IMG 01',
  ]);
});

it('rejects media bytes and broken references and recovers legacy labels without rendering a source', () => {
  const before = project();
  const withSource = structuredClone(before);
  Object.assign(withSource.attachments![0], { source: 'https://attacker.example/pixel.svg' });
  expect(() => normalizeProject(withSource)).toThrow();
  const broken = structuredClone(before);
  broken.steps[0] = {
    ...before.steps[0],
    media: { kind: 'image', attachmentId: 'pdf' },
  } as Project['steps'][number];
  expect(() => normalizeProject(broken)).toThrow();
  const legacy = {
    ...withSource,
    contact: { ...withSource.contact, avatar: 'https://attacker.example/brand.svg' },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
  render(<App />);
  expect(api().getProject()).toEqual(normalizeProject(before));
  expect(document.querySelector('img[src*="attacker.example"]')).toBeNull();
  expect(document.querySelector('.chat-header img')).toHaveAttribute('src', storeIcon);
});
