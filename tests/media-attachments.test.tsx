// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { Blob as NativeBlob } from 'node:buffer';
import { loadSharedProject, sharedRoute } from '../src/core/codec';
import {
  conversationAttachments,
  DOCUMENT_EXTENSIONS,
  stepAttachment,
} from '../src/core/attachments';
import { normalizeProject } from '../src/core/project';
import type { Project } from '../src/core/types';

function project(): Project {
  return {
    version: 1,
    contact: { name: 'Oficina', verified: false },
    steps: [
      {
        id: 'customer-image',
        type: 'user',
        text: '',
        delay: 0,
        media: {
          kind: 'image',
          file: { extension: 'jpg', name: 'Foto A' },
          caption: 'Legenda automática',
        },
      },
      {
        id: 'business-document',
        type: 'business',
        text: '',
        delay: 0,
        media: {
          kind: 'document',
          file: { extension: 'pdf', name: 'Orçamento', size: 240, unit: 'KB' },
        },
      },
      {
        id: 'business-image',
        type: 'business',
        text: '',
        delay: 0,
        media: {
          kind: 'image',
          file: { extension: 'png', name: 'Foto C' },
          caption: 'Foto da empresa',
        },
      },
      {
        id: 'second-image',
        type: 'business',
        text: '',
        delay: 0,
        media: {
          kind: 'image',
          file: { extension: 'jpg', name: 'Foto B' },
          caption: 'Outra legenda',
        },
      },
    ],
  };
}
const api = () => window.whatsDemo!;
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
    { attachmentId: 'media:business-image', text: 'Minha foto', direction: 'user' },
    { attachmentId: 'media:business-document', direction: 'business' },
    { attachmentId: 'media:business-image', text: 'Foto da empresa' },
    { attachmentId: 'media:second-image', text: 'Outra legenda' },
  ]);
  expect(conversationAttachments(api().getProject())).toHaveLength(4);
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
    { attachmentId: 'media:customer-image', text: 'Legenda automática' },
    { attachmentId: 'media:business-document' },
    { attachmentId: 'media:business-image', text: 'Foto da empresa' },
    { attachmentId: 'media:second-image', text: 'Outra legenda' },
  ]);
  fireEvent.click(button('Reproduzir automaticamente'));
  await tick(1350);
  fireEvent.click(button('Reiniciar prévia'));
  await tick(8000);
  expect(api().getState().messages).toHaveLength(0);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('configures a document inline and validates its numeric size in both units', async () => {
  const candidate: Project = {
    version: 1,
    contact: { name: 'Oficina', verified: false },
    steps: [{ id: 'business', type: 'business', text: 'Olá', delay: 0 }],
  };
  render(<App />);
  act(() => api().loadProject(candidate));
  fireEvent.click(screen.getByRole('radio', { name: 'Documento' }));
  expect(button('Iniciar manual')).toBeDisabled();
  for (const extension of DOCUMENT_EXTENSIONS)
    expect(screen.getByRole('radio', { name: '.' + extension })).toBeVisible();

  fireEvent.click(screen.getByRole('radio', { name: '.xlsx' }));
  fireEvent.change(screen.getByRole('textbox', { name: /^Nome do arquivo/ }), {
    target: { value: 'Recibo.pdf' },
  });
  const size = screen.getByRole('spinbutton', { name: 'Tamanho exibido' });
  fireEvent.change(size, { target: { value: '100001' } });
  expect(button('Iniciar manual')).toBeDisabled();
  expect(screen.getByText(/maior que zero e de até 100 MB/)).toBeVisible();
  expect(normalizeProject(api().getProject(), { allowDrafts: true }).steps[0]).toMatchObject({
    media: { file: { size: 100001, unit: 'KB' } },
  });
  expect(() => normalizeProject(api().getProject())).toThrow('100 MB');

  fireEvent.change(size, { target: { value: '100000' } });
  expect(button('Iniciar manual')).toBeEnabled();
  const unit = screen.getByRole('combobox', { name: 'Unidade' });
  fireEvent.keyDown(unit, { key: 'ArrowDown' });
  fireEvent.click(screen.getByRole('option', { name: 'MB' }));
  expect(button('Iniciar manual')).toBeDisabled();
  fireEvent.change(size, { target: { value: '100' } });

  const current = api().getProject();
  expect(current).not.toHaveProperty('attachments');
  expect(current.steps[0]).toMatchObject({
    media: {
      kind: 'document',
      file: { extension: 'xlsx', name: 'Recibo.pdf', size: 100, unit: 'MB' },
    },
  });
  expect(stepAttachment(current.steps[0])).toMatchObject({
    name: 'Recibo.xlsx',
    sizeLabel: '100 MB',
  });
  expect(button('Iniciar manual')).toBeEnabled();
  expect(button('Recibo.xlsx')).toBeVisible();
  expect(screen.getByText('XLSX · 100 MB')).toBeVisible();
  expect(screen.queryByRole('button', { name: /Escolher dos anexos/ })).toBeNull();
  expect(document.querySelector('input[type="file"]')).toBeNull();
});

it('shares inline image metadata and uses the configured pictures in the manual gallery', async () => {
  vi.stubGlobal('Blob', NativeBlob);
  const candidate: Project = {
    version: 1,
    contact: { name: 'Oficina', verified: false },
    steps: [
      { id: 'customer-image', type: 'user', text: '', delay: 0 },
      {
        id: 'business-image',
        type: 'business',
        text: '',
        delay: 0,
        media: { kind: 'image', file: { extension: 'png', name: 'Foto da empresa' } },
      },
    ],
  };
  render(<App />);
  act(() => api().loadProject(candidate));
  const format = screen.getByRole('combobox', { name: 'Formato da mensagem' });
  fireEvent.keyDown(format, { key: 'ArrowDown' });
  fireEvent.click(screen.getByRole('option', { name: 'Imagem' }));
  expect(screen.getByRole('radio', { name: '.png' })).toBeChecked();
  fireEvent.click(screen.getByRole('radio', { name: '.jpg' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Texto curto na imagem' }), {
    target: { value: 'Peça' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Legenda (opcional)' }), {
    target: { value: 'Com defeito' },
  });

  const current = api().getProject();
  expect(current).not.toHaveProperty('attachments');
  expect(current.steps[0]).toMatchObject({
    media: { kind: 'image', file: { extension: 'jpg', name: 'Peça' }, caption: 'Com defeito' },
  });
  expect(conversationAttachments(current).map(({ name }) => name)).toEqual([
    'Peça',
    'Foto da empresa',
  ]);
  expect(button('Peça')).toHaveTextContent('JPG');
  expect(screen.getByText('Com defeito', { selector: '.bubble p' })).toBeVisible();
  const url = new URL(await api().createShareURL());
  expect(await loadSharedProject(sharedRoute(url.hash)!)).toEqual(current);

  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  fireEvent.click(button('Iniciar manual'));
  fireEvent.click(button('Anexar'));
  fireEvent.click(sheet().getByRole('button', { name: 'Galeria' }));
  fireEvent.click(sheet().getByRole('button', { name: 'Foto da empresa' }));
  fireEvent.click(sheet().getByRole('button', { name: 'Enviar mensagem' }));
  await tick(300);
  expect(api().getState().messages[0]).toMatchObject({ attachmentId: 'media:business-image' });

  fireEvent.click(button('Reproduzir automaticamente'));
  await tick(9000);
  expect(api().getState().messages[0]).toMatchObject({
    attachmentId: 'media:customer-image',
    text: 'Com defeito',
  });
});

it('rejects disallowed inline extensions, sources and document sizes', () => {
  const candidate = (file: object, kind = 'document') => ({
    version: 1,
    contact: { name: 'Oficina', verified: false },
    steps: [{ id: 'test', type: 'user', text: '', delay: 0, media: { kind, file } }],
  });
  for (const size of [undefined, 0, -1, 100.01, Infinity, '20']) {
    expect(() =>
      normalizeProject(candidate({ extension: 'pdf', name: 'Doc', size, unit: 'MB' })),
    ).toThrow();
  }
  expect(() => normalizeProject(candidate({ extension: 'svg', name: 'Image' }, 'image'))).toThrow();
  expect(() =>
    normalizeProject(
      candidate({ extension: 'jpg', name: 'Image', source: 'data:image/png;base64,a' }, 'image'),
    ),
  ).toThrow();
});
