// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createDefaultProject } from '../src/core/defaults';
import { createStep, STORAGE_KEY } from '../src/core/project';
import { useAddedStepFocus } from '../src/features/editor/hooks/useAddedStepFocus';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  ['＋ Cliente', 'user'],
  ['＋ Empresa', 'business'],
  ['＋ Flow', 'flow'],
] as const)('adiciona %s no final e foca o campo de texto', async (label, type) => {
  const project = createDefaultProject();
  project.contact.avatar = '';
  const originalIds = project.steps.map((step) => step.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: label }));
  const card = screen.getByRole('article', { name: 'Etapa 6' });
  expect(
    within(card).getByLabelText(
      type === 'flow' ? 'Mensagem com o convite ao Flow' : 'Texto da mensagem',
    ),
  ).toHaveFocus();
  const steps = window.whatsappFakeFlows!.getProject().steps;
  expect(steps.slice(0, -1).map((step) => step.id)).toEqual(originalIds);
  expect(steps.at(-1)?.type).toBe(type);
  expect(document.querySelector('.editor-footer')).toContainElement(
    screen.getByRole('group', { name: 'Adicionar etapas à conversa' }),
  );
});

function setupLayout({ scrollable = true, visible = false } = {}) {
  const scroll = document.createElement('div'),
    card = document.createElement('article'),
    field = document.createElement('textarea');
  card.dataset.stepId = 'added';
  card.append(field);
  scroll.append(card);
  document.body.append(scroll);
  Object.defineProperties(scroll, {
    scrollHeight: { value: scrollable ? 2000 : 400 },
    clientHeight: { value: 400 },
  });
  scroll.scrollTop = 200;
  scroll.scrollTo = vi.fn();
  card.scrollIntoView = vi.fn();
  vi.spyOn(scroll, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 600, 400));
  vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, visible ? 150 : 1000, 600, 200),
  );
  const focus = vi.spyOn(field, 'focus');
  const steps = [{ ...createStep('user'), id: 'added' }];
  const ref = { current: scroll };
  return { scroll, card, field, focus, ...renderHook(() => useAddedStepFocus(steps, ref)) };
}
it.each([false, true])('rola apenas o editor e respeita movimento reduzido: %s', (reduced) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduced })),
  );
  const app = setupLayout();
  act(() => app.result.current('added'));
  expect(app.field).toHaveFocus();
  expect(app.focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(app.scroll.scrollTo).toHaveBeenCalledWith({
    top: 1084,
    behavior: reduced ? 'auto' : 'smooth',
  });
  expect(app.card.scrollIntoView).not.toHaveBeenCalled();
  app.rerender();
  expect(app.focus).toHaveBeenCalledOnce();
});
it('foca sem mover a rolagem se a etapa já está visível', () => {
  const app = setupLayout({ visible: true });
  act(() => app.result.current('added'));
  expect(app.field).toHaveFocus();
  expect(app.scroll.scrollTo).not.toHaveBeenCalled();
});
it('rola a página quando o editor usa a rolagem externa', () => {
  const app = setupLayout({ scrollable: false });
  act(() => app.result.current('added'));
  expect(app.card.scrollIntoView).toHaveBeenCalledWith({
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
  });
});
