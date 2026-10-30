// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { ReplyButtonsEditor } from '../src/features/editor/components/ReplyButtonsEditor';
import { App } from '../src/app/App';
import { STORAGE_KEY } from '../src/core/project';
import { createDefaultProject } from '../src/core/defaults';
import type { ReplyButtonsMessage } from '../src/core/types';
const url = {
  id: 'site',
  title: 'Shop now',
  type: 'url' as const,
  url: 'https://example.com/shop',
};
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  vi.restoreAllMocks();
});
const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
async function start(interactive: ReplyButtonsMessage) {
  const project = createDefaultProject();
  project.contact.avatar = '';
  project.steps = [
    { id: 'buttons', type: 'business', text: 'Our offers', delay: 0, interactive },
    { id: 'done', type: 'business', text: 'Next step', delay: 0 },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
}
function Harness() {
  const [value, setValue] = useState<ReplyButtonsMessage>({
    kind: 'buttons',
    context: 'template',
    buttons: [url],
  });
  return (
    <>
      <ReplyButtonsEditor value={value} onChange={setValue} />
      <output data-testid="button-state">{JSON.stringify(value)}</output>
    </>
  );
}
it('edits destinations and switches button types through accessible selects', async () => {
  render(<Harness />);
  fireEvent.change(screen.getByRole('textbox', { name: /^URL do site/ }), {
    target: { value: 'https://example.com/new' },
  });
  expect(screen.getByTestId('button-state')).toHaveTextContent('https://example.com/new');
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Tipo do botão' }), { key: 'ArrowDown' });
  await act(async () => {});
  fireEvent.click(screen.getByRole('option', { name: 'Copiar código' }));
  expect(screen.getByLabelText('Código para copiar (até 20 caracteres)')).toBeInTheDocument();
  expect(screen.getByLabelText('Texto do botão')).toBeDisabled();
  expect(screen.queryByRole('textbox', { name: /^URL do site/ })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Código para copiar (até 20 caracteres)'), {
    target: { value: 'SAVE10' },
  });
  expect(screen.getByTestId('button-state')).toHaveTextContent('SAVE10');
});
it('shows the supplied URL icon and simulates an action without sending a user reply', async () => {
  await start({ kind: 'buttons', buttons: [url] });
  const open = vi.spyOn(window, 'open');
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await tick(1);
  const action = screen.getByRole('button', { name: 'Shop now' });
  expect(action.querySelector('svg path')).toHaveAttribute('d', expect.stringContaining('M5 21'));
  fireEvent.click(action);
  expect(screen.getByRole('dialog', { name: 'URL do site' })).toHaveTextContent(
    'https://example.com/shop',
  );
  expect(document.querySelector('.messages')).not.toHaveTextContent('Next step');
  fireEvent.click(screen.getByRole('button', { name: 'Continuar demonstração' }));
  await tick(1);
  expect(document.querySelector('.messages')).toHaveTextContent('Next step');
  expect(document.querySelectorAll('.bubble.user')).toHaveLength(0);
  expect(open).not.toHaveBeenCalled();
  open.mockRestore();
});
it('keeps mixed templates waiting for a quick reply after a CTA is inspected', async () => {
  await start({
    kind: 'buttons',
    context: 'template',
    buttons: [url, { id: 'yes', title: 'Yes please' }],
  });
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await tick(1);
  fireEvent.click(screen.getByRole('button', { name: 'Shop now' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar demonstração' }));
  await tick(1);
  expect(document.querySelector('.messages')).not.toHaveTextContent('Next step');
  fireEvent.click(screen.getByRole('button', { name: 'Yes please' }));
  await tick(1);
  expect(document.querySelector('.bubble.user')).toHaveTextContent('Yes please');
  expect(document.querySelector('.messages')).toHaveTextContent('Next step');
});
it('uses overflow for templates with more than three buttons and closes it on selection', async () => {
  await start({
    kind: 'buttons',
    context: 'template',
    buttons: [1, 2, 3, 4].map((n) => ({ id: String(n), title: 'Option ' + n })),
  });
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await tick(1);
  expect(screen.queryByRole('button', { name: 'Option 3' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ver todas as opções' }));
  const sheet = screen.getByRole('dialog', { name: 'Ver todas as opções' });
  fireEvent.click(within(sheet).getByRole('button', { name: 'Option 4' }));
  await tick(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.querySelector('.bubble.user')).toHaveTextContent('Option 4');
});
it.each(['overflow', 'action'] as const)(
  'completes automatic %s interaction inside the phone',
  async (mode) => {
    await start(
      mode === 'action'
        ? { kind: 'buttons', buttons: [url] }
        : {
            kind: 'buttons',
            context: 'template',
            autoReplyId: '4',
            buttons: [1, 2, 3, 4].map((n) => ({ id: String(n), title: 'Option ' + n })),
          },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
    for (let i = 0; i < 15; i++) await tick(1000);
    expect(document.querySelector('.play-status')).toHaveTextContent('Conversa concluída.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelectorAll('.bubble.user')).toHaveLength(mode === 'action' ? 0 : 1);
  },
);
