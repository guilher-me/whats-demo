// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ReplyButtonsEditor } from '../src/features/editor/components/ReplyButtonsEditor';
import { ListSectionEditor } from '../src/features/editor/components/ListSectionEditor';
import type { ListSection, ReplyButtonsMessage } from '../src/core/types';

const options = [
  { id: 'first', title: 'Primeira', description: 'Descrição original' },
  { id: 'second', title: 'Segunda', description: 'Outra descrição' },
];
let unequalHeights = false;
function Harness({ list = false }: { list?: boolean }) {
  const [buttons, setButtons] = useState<ReplyButtonsMessage>({
    kind: 'buttons',
    buttons: options,
    autoReplyId: 'first',
  });
  const [section, setSection] = useState<ListSection>({ title: 'Seção', rows: options });
  return (
    <>
      {list ? (
        <ListSectionEditor
          section={section}
          index={0}
          canAdd
          removable={false}
          onChange={setSection}
          onRemove={() => {}}
        />
      ) : (
        <ReplyButtonsEditor value={buttons} onChange={setButtons} />
      )}
      <output data-testid="state">{JSON.stringify(list ? section : buttons)}</output>
    </>
  );
}
beforeEach(() => {
  unequalHeights = false;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const row = this.closest('.sortable-option');
    const index = row ? Array.from(row.parentElement!.children).indexOf(row) : 0;
    const rows = row ? Array.from(row.parentElement!.children) : [];
    const heights = rows.map((node) =>
      unequalHeights ? (node.querySelector('input')?.value === 'Primeira' ? 240 : 70) : 140,
    );
    const top = heights.slice(0, index).reduce((a, b) => a + b, 0);
    const height = row ? heights[index] : 310;
    return {
      x: 0,
      y: top,
      top,
      left: 0,
      right: 400,
      bottom: top + height,
      width: 400,
      height,
      toJSON() {},
    };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
async function move(cancel = false) {
  const handle = screen.getByRole('button', { name: 'Reordenar opção 1: Primeira' });
  handle.focus();
  fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
  await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));
  fireEvent.keyDown(document, { code: 'ArrowDown', key: 'ArrowDown' });
  await waitFor(() =>
    expect(document.querySelector('[role="status"]')).toHaveTextContent('Posição 2'),
  );
  fireEvent.keyDown(document, { code: cancel ? 'Escape' : 'Space', key: cancel ? 'Escape' : ' ' });
  await waitFor(() => expect(handle).not.toHaveAttribute('aria-pressed', 'true'));
}
it('reordena botões pelo teclado preservando IDs e a resposta automática', async () => {
  render(<Harness />);
  await move();
  const value = JSON.parse(screen.getByTestId('state').textContent!);
  expect(value.buttons).toEqual([options[1], options[0]]);
  expect(value.autoReplyId).toBe('first');
  expect(
    screen.getAllByLabelText('Texto do botão').map((input) => (input as HTMLInputElement).value),
  ).toEqual(['Segunda', 'Primeira']);
});
it('reordena itens da seção preservando suas descrições', async () => {
  render(<Harness list />);
  await move();
  expect(JSON.parse(screen.getByTestId('state').textContent!).rows).toEqual([
    options[1],
    options[0],
  ]);
});
it('Escape cancela a troca sem alterar a ordem', async () => {
  render(<Harness />);
  await move(true);
  expect(JSON.parse(screen.getByTestId('state').textContent!).buttons).toEqual(options);
});

it.each([false, true])('keeps unequal option heights while dragging; list=%s', async (list) => {
  unequalHeights = true;
  render(<Harness list={list} />);
  const handle = screen.getByRole('button', { name: 'Reordenar opção 2: Segunda' });
  handle.focus();
  fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
  await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));
  fireEvent.keyDown(document, { code: 'ArrowUp', key: 'ArrowUp' });
  await waitFor(() =>
    expect(document.querySelector('[role="status"]')).toHaveTextContent('Posição 1'),
  );
  const moving = document.querySelector<HTMLElement>('.sortable-option.is-dragging')!;
  expect(moving.style.transform).toContain('translate3d(');
  expect(moving.style.transform).not.toContain('scale');
  fireEvent.keyDown(document, { code: 'Space', key: ' ' });
  await waitFor(() => expect(handle).not.toHaveAttribute('aria-pressed', 'true'));
  const state = JSON.parse(screen.getByTestId('state').textContent!);
  expect(list ? state.rows : state.buttons).toEqual([options[1], options[0]]);
  if (!list) expect(state.autoReplyId).toBe('first');
});
