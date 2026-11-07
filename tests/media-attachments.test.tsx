// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import {
  exportDocument,
  importDocument,
  prepareDocument,
  readDocument,
} from '../src/core/document';
import { STORAGE_KEY } from '../src/core/project';
import type { Attachment, Project } from '../src/core/types';

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
const images: Attachment[] = ['A', 'B', 'C'].map((id) => ({
  id,
  name: `Foto ${id}`,
  kind: 'image',
  source: PNG,
  customerVisible: true,
}));
const documentItem: Attachment = {
  id: 'pdf',
  name: 'Orçamento.pdf',
  kind: 'document',
  sizeLabel: '240 KB',
  customerVisible: false,
};
function project(): Project {
  return {
    version: 1,
    contact: { name: 'Oficina', avatar: '', verified: false },
    attachments: [...images, documentItem],
    steps: [
      {
        id: 'customer-image',
        type: 'user',
        text: '',
        delay: 0,
        media: { kind: 'image', attachmentId: 'A', caption: 'Legenda automática' },
      },
      {
        id: 'business-document',
        type: 'business',
        text: '',
        delay: 0,
        media: { kind: 'document', attachmentId: 'pdf' },
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
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn().mockResolvedValue({ width: 1, height: 1, close: vi.fn() }),
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(PNG);
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
    await api().loadDocumentAsync(exportDocument(project()));
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
  expect(sheet().getByRole('img', { name: 'Foto B' })).toBeVisible();
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
  await tick(1);
  expect(api().getState().messages).toMatchObject([
    { attachmentId: 'C', text: 'Minha foto', direction: 'user' },
    { attachmentId: 'pdf', direction: 'business' },
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
  ]);
  fireEvent.click(button('Reproduzir automaticamente'));
  await tick(1350);
  fireEvent.click(button('Reiniciar prévia'));
  await tick(8000);
  expect(api().getState().messages).toHaveLength(0);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('creates a simulated document in a business node and shows its usage in the library', async () => {
  render(<App />);
  const p = project();
  delete p.attachments;
  p.steps = [{ id: 'business', type: 'business', text: 'Olá', delay: 0 }];
  act(() => {
    api().loadProject(p);
  });
  fireEvent.click(screen.getByRole('radio', { name: 'Documento' }));
  expect(button('Iniciar manual')).toBeDisabled();
  fireEvent.click(button('Escolher dos anexos'));
  fireEvent.click(sheet().getByRole('button', { name: 'Criar documento simulado' }));
  fireEvent.change(sheet().getByLabelText('Nome do arquivo'), { target: { value: 'Recibo.pdf' } });
  fireEvent.change(sheet().getByLabelText('Tamanho exibido'), { target: { value: '18 KB' } });
  fireEvent.click(sheet().getByRole('button', { name: 'Salvar anexo' }));
  const item = api().getProject().attachments?.[0];
  expect(item).toMatchObject({ kind: 'document', sizeLabel: '18 KB', customerVisible: false });
  expect(api().getProject().steps[0]).toMatchObject({ media: { attachmentId: item?.id } });
  fireEvent.click(screen.getByRole('button', { name: /Anexos da conversa/ }));
  expect(button('Remover Recibo.pdf')).toBeDisabled();
  expect(screen.getByText(/Usado nas etapas 1/)).toBeVisible();
});

it('shows upload limits, rejects oversized inputs and stores a large photo as compact WebP', async () => {
  render(<App />);
  fireEvent.click(button('Adicionar anexo'));
  fireEvent.click(sheet().getByRole('button', { name: 'Carregar imagem' }));
  expect(sheet().getByText(/12 MiB, 8192 px por lado e 32 megapixels/)).toBeVisible();
  const choose = (file: File) => {
    fireEvent.change(sheet().getByLabelText(/Arquivo de imagem/), { target: { files: [file] } });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
  };
  const oversized = new File([], 'pesada.png', { type: 'image/png' });
  const readOversized = vi.fn();
  Object.defineProperties(oversized, {
    size: { value: 13 * 1024 * 1024 },
    arrayBuffer: { value: readOversized },
  });
  choose(oversized);
  expect(await sheet().findByRole('alert')).toHaveTextContent(/13 MiB.*12 MiB/);
  expect(readOversized).not.toHaveBeenCalled();

  const pngWithDimensions = (width: number, height: number) => {
    const bytes = new Uint8Array(3 * 1024 * 1024);
    bytes.set(Uint8Array.from(atob(PNG.split(',')[1]), (char) => char.charCodeAt(0)));
    const header = new DataView(bytes.buffer);
    header.setUint32(16, width);
    header.setUint32(20, height);
    const file = new File([], 'foto.png', { type: 'image/png' });
    Object.defineProperties(file, {
      size: { value: bytes.length },
      arrayBuffer: { value: async () => bytes.buffer },
    });
    return file;
  };
  choose(pngWithDimensions(8192, 8192));
  expect(await sheet().findByRole('alert')).toHaveTextContent(/8192 × 8192 px.*32 megapixels/);
  expect(createImageBitmap).not.toHaveBeenCalled();

  const webp =
    'data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAADQAQCdASoBAAEAAgA0JaACdLoB+AADsAD+8Oj3/yC5YXXI1/5sCua5+agAAA==';
  vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockReturnValue(webp);
  vi.mocked(createImageBitmap).mockResolvedValue({
    width: 4601,
    height: 6662,
    close: vi.fn(),
  } as unknown as ImageBitmap);
  choose(pngWithDimensions(4601, 6662));
  await waitFor(() => expect(api().getProject().attachments?.[0]).toMatchObject({ source: webp }));
  expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/webp', 0.78);
  const doc = api().getDocument();
  const asset = doc.resources.attachments?.[0].assetId;
  expect(doc.resources.assets[asset]).toMatchObject({ mimeType: 'image/webp' });
  expect(exportDocument(await prepareDocument(doc))).toEqual(doc);
});

it('stores a raster once, preserves per-step captions and rejects invalid media references', async () => {
  const p = project();
  p.steps.push({
    id: 'again',
    type: 'business',
    text: '',
    delay: 0,
    media: { kind: 'image', attachmentId: 'A', caption: 'Outra legenda' },
  });
  const doc = exportDocument(p);
  expect(Object.keys(doc.resources.assets)).toEqual(['attachment-A']);
  expect(doc.journey.steps[0].message.image.caption).toBe('Legenda automática');
  expect(doc.journey.steps[2].message.image.caption).toBe('Outra legenda');
  expect(exportDocument(await prepareDocument(doc))).toEqual(doc);
  const invalid = structuredClone(doc);
  invalid.journey.steps[0].bindings.attachmentId = 'pdf';
  expect(() => importDocument(invalid)).toThrow();
  invalid.journey.steps[0].bindings.attachmentId = 'missing';
  expect(() => importDocument(invalid)).toThrow();
});

it('rejects disguised images and excessive files and keeps the current draft on an invalid shared load', async () => {
  render(<App />);
  const before = api().getProject();
  const doc = exportDocument(project());
  expect(() => api().loadDocument(doc)).toThrow('loadDocumentAsync');
  for (const payload of ['<svg onload="alert(1)"/>', '<html><script>alert(1)</script></html>']) {
    const invalid = structuredClone(doc);
    invalid.resources.assets['attachment-A'].data = btoa(payload);
    await act(async () => {
      await expect(api().loadDocumentAsync(invalid)).rejects.toThrow();
    });
    expect(api().getProject()).toEqual(before);
    expect(document.querySelector(`img[src*="${btoa(payload)}"]`)).toBeNull();
  }
  await expect(readDocument({ size: 8 * 1024 * 1024 + 1 } as File)).rejects.toThrow();
  const oversized = structuredClone(doc);
  oversized.resources.assets['attachment-A'].data = 'A'.repeat(3 * 1024 * 1024);
  await expect(prepareDocument(oversized)).rejects.toThrow();
  const corrupt = structuredClone(doc);
  corrupt.resources.assets['attachment-A'].data = btoa(atob(PNG.split(',')[1]) + 'corrupt');
  vi.mocked(createImageBitmap).mockRejectedValueOnce(new Error('Invalid pixels'));
  await expect(prepareDocument(corrupt)).rejects.toThrow();
});

it('revalidates a recovered library before rendering it and retains rejected storage', async () => {
  const p = project();
  p.attachments = [
    {
      id: 'A',
      kind: 'image',
      customerVisible: true,
      name: 'Malicious',
      source: `data:image/png;base64,${btoa('<svg/>')}`,
    },
  ];
  p.steps = p.steps.slice(0, 1);
  const raw = JSON.stringify(p);
  localStorage.setItem(STORAGE_KEY, raw);
  render(<App />);
  await waitFor(() =>
    expect(screen.getByText(/Não foi possível recuperar os anexos/)).toBeVisible(),
  );
  expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  expect(document.querySelector(`img[src*="${btoa('<svg/>')}"]`)).toBeNull();
});

it('sends a customer document from the document picker and excludes private items', async () => {
  render(<App />);
  const p = project();
  p.attachments = [
    documentItem,
    { ...documentItem, id: 'public-pdf', name: 'Recibo.pdf', customerVisible: true },
  ];
  p.steps = [
    {
      id: 'document',
      type: 'user',
      text: '',
      delay: 0,
      media: { kind: 'document', attachmentId: 'public-pdf' },
    },
  ];
  await act(async () => {
    await api().loadDocumentAsync(exportDocument(p));
  });
  fireEvent.click(button('Anexar'));
  expect(sheet().getByRole('button', { name: 'Galeria' })).toBeDisabled();
  fireEvent.click(sheet().getByRole('button', { name: 'Documento' }));
  expect(sheet().queryByRole('button', { name: /Orçamento.pdf/ })).toBeNull();
  fireEvent.click(sheet().getByRole('button', { name: /Recibo.pdf/ }));
  expect(sheet().queryByLabelText('Legenda (opcional)')).toBeNull();
  await act(async () => {
    fireEvent.click(sheet().getByRole('button', { name: 'Enviar mensagem' }));
  });
  expect(api().getState().messages).toMatchObject([{ attachmentId: 'public-pdf', text: '' }]);
});

it('preserves a newer project if attachment processing completes after a replacement', async () => {
  render(<App />);
  const doc = exportDocument(project());
  doc.resources.assets['attachment-A'].data = btoa(atob(PNG.split(',')[1]) + 'pending-load');
  let finish!: (image: ImageBitmap) => void;
  vi.mocked(createImageBitmap).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const loading = api().loadDocumentAsync(doc);
  const stale = expect(loading).rejects.toThrow(/O projeto mudou/);
  await waitFor(() => expect(finish).toBeDefined());
  const replacement = api().getExample();
  replacement.contact.name = 'Outro projeto';
  act(() => {
    api().loadProject(replacement);
  });
  await act(async () => {
    finish({ width: 1, height: 1, close: vi.fn() } as unknown as ImageBitmap);
    await stale;
  });
  expect(api().getProject().contact.name).toBe('Outro projeto');
  expect(api().getProject().attachments).toBeUndefined();
});
