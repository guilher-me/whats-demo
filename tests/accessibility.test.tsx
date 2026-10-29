// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { App } from '../src/app/App';
import { PlaybackControls } from '../src/features/playback/components/PlaybackControls';
import { createStep } from '../src/core/project';
import { createInteractive } from '../src/core/interactive';
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  localStorage.clear();
  history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('exibe somente dois controles nomeados, sem texto visível, e adapta as ações durante a reprodução', () => {
  const actions = { onManual: vi.fn(), onAuto: vi.fn(), onStop: vi.fn(), onReset: vi.fn() };
  const { rerender } = render(<PlaybackControls {...actions} disabled={false} running={false} />);
  const group = screen.getByRole('group', { name: 'Controles de reprodução' });
  expect(within(group).getAllByRole('button')).toHaveLength(2);
  const manual = screen.getByRole('button', { name: 'Iniciar manual' });
  expect(manual).toHaveTextContent('');
  fireEvent.click(manual);
  expect(actions.onManual).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  expect(actions.onAuto).toHaveBeenCalledOnce();
  rerender(<PlaybackControls {...actions} disabled={false} running />);
  expect(within(group).getAllByRole('button')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Parar reprodução' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reiniciar prévia' }));
  expect(actions.onStop).toHaveBeenCalledOnce();
  expect(actions.onReset).toHaveBeenCalledOnce();
});

it('mostra tooltips por mouse e teclado, permite Tab e fecha com Escape sem perder o foco', async () => {
  const user = userEvent.setup();
  render(
    <PlaybackControls
      disabled={false}
      running={false}
      onManual={() => {}}
      onAuto={() => {}}
      onStop={() => {}}
      onReset={() => {}}
    />,
  );
  const manual = screen.getByRole('button', { name: 'Iniciar manual' });
  await user.hover(manual);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Preencha os campos');
  await user.unhover(manual);
  expect(screen.queryByRole('tooltip')).toBeNull();
  act(() => manual.focus());
  expect(manual).toHaveAccessibleDescription(/Preencha os campos/);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('tooltip')).toBeNull();
  expect(manual).toHaveFocus();
  await user.tab();
  const automatic = screen.getByRole('button', { name: 'Reproduzir automaticamente' });
  expect(automatic).toHaveFocus();
  expect(screen.getByRole('tooltip')).toHaveTextContent('cursor');
});

it.each(['editor', 'flow', 'list'] as const)(
  'verifica semântica e nomes acessíveis na visualização %s',
  async (view) => {
    render(<App />);
    await act(async () => {});
    if (view !== 'editor') {
      const step = createStep(view === 'flow' ? 'flow' : 'business');
      if (step.type === 'business') step.interactive = createInteractive('list');
      act(() =>
        window.whatsappFakeFlows!.loadProject({
          version: 1,
          contact: { name: 'Empresa exemplo', avatar: '', verified: true },
          steps: [step],
        }),
      );
      fireEvent.click(screen.getByRole('article', { name: 'Etapa 1' }));
      fireEvent.click(
        screen.getByRole('button', { name: view === 'flow' ? 'Abrir formulário' : /Ver opções/ }),
      );
    }
    // jsdom cannot measure actual color contrast; visual contrast needs browser verification.
    const result = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  },
);
