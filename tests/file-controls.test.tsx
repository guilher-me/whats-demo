// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { it, expect, vi, afterEach } from 'vitest';
import { FileControls } from '../src/features/sharing/FileControls';
import { createDefaultProject } from '../src/core/defaults';
import { exportDocument } from '../src/core/document';
afterEach(cleanup);
it('validates before replacement, supports cancellation and offers a backup', async () => {
  const current = createDefaultProject();
  current.contact.avatar = '';
  const next = createDefaultProject();
  next.contact.name = 'New shop';
  next.contact.avatar = '';
  const replace = vi.fn();
  render(<FileControls project={current} disabled={false} onImport={replace} />);
  const file = new File(['{}'], 'journey.json');
  Object.defineProperty(file, 'text', { value: async () => JSON.stringify(exportDocument(next)) });
  fireEvent.change(screen.getByLabelText('Importar JSON'), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  expect(replace).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Exportar rascunho atual' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(replace).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Importar JSON'), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Substituir rascunho atual' }));
  expect(replace).toHaveBeenCalledWith(
    expect.objectContaining({ contact: expect.objectContaining({ name: 'New shop' }) }),
  );
});
it('shows invalid files prominently and leaves the draft untouched', async () => {
  const replace = vi.fn(),
    p = createDefaultProject();
  render(<FileControls project={p} disabled={false} onImport={replace} />);
  const file = new File(['{}'], 'bad.json');
  Object.defineProperty(file, 'text', { value: async () => '{bad' });
  fireEvent.change(screen.getByLabelText('Importar JSON'), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  expect(replace).not.toHaveBeenCalled();
});
