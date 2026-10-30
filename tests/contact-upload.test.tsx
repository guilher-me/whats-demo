// @vitest-environment jsdom
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ContactEditor } from '../src/features/editor/components/ContactEditor';
const { processPhoto } = vi.hoisted(() => ({ processPhoto: vi.fn() }));
vi.mock('../src/core/images/sanitize', () => ({
  sanitizePhotoFile: processPhoto,
  sanitizeAvatar: vi.fn().mockResolvedValue(''),
}));
afterEach(() => {
  cleanup();
  processPhoto.mockReset();
});
function selectFile() {
  fireEvent.change(screen.getByLabelText('Selecionar imagem do contato'), {
    target: { files: [new File(['pixels'], 'photo.png', { type: 'image/png' })] },
  });
}
it('preserves name edits made while a photo is being processed', async () => {
  let finish!: (value: string) => void;
  processPhoto.mockImplementation(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const onChange = vi.fn();
  function Harness() {
    const [contact, setContact] = useState({ name: 'Original', avatar: '', verified: false });
    return (
      <ContactEditor
        contact={contact}
        onError={vi.fn()}
        onChange={(next) => {
          onChange(next);
          setContact(next);
        }}
      />
    );
  }
  render(<Harness />);
  selectFile();
  fireEvent.change(screen.getByLabelText('Nome do contato'), { target: { value: 'New name' } });
  await act(async () => {
    finish('assets/prevent-senior.png');
  });
  expect(onChange).toHaveBeenLastCalledWith({
    name: 'New name',
    avatar: 'assets/prevent-senior.png',
    verified: false,
  });
});
it('does not apply a stale photo after switching projects', async () => {
  let finish!: (value: string) => void;
  processPhoto.mockImplementation(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const onChange = vi.fn();
  const contact = { name: 'Original', avatar: '', verified: false };
  const { rerender } = render(
    <ContactEditor key={1} contact={contact} onChange={onChange} onError={vi.fn()} />,
  );
  selectFile();
  rerender(
    <ContactEditor
      key={2}
      contact={{ ...contact, name: 'Other project' }}
      onChange={onChange}
      onError={vi.fn()}
    />,
  );
  await act(async () => {
    finish('assets/prevent-senior.png');
  });
  expect(onChange).not.toHaveBeenCalled();
});
