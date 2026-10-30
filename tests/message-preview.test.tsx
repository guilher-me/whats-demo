// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createDefaultProject } from '../src/core/defaults';
import { createInteractive } from '../src/core/interactive';
import { createStep, STORAGE_KEY } from '../src/core/project';
import type { Step } from '../src/core/types';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function start(steps?: Step[]) {
  const project = createDefaultProject();
  project.contact.avatar = '';
  if (steps) project.steps = steps;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
}
const draft = () =>
  screen.getByLabelText('Prévia da mensagem em edição', { selector: '.draft-chat' });
it('seleciona pelo teclado e atualiza o texto sem enviar mensagens', async () => {
  await start();
  const card = screen.getByRole('article', { name: 'Etapa 1' });
  fireEvent.focus(within(card).getByLabelText('Texto da mensagem'));
  expect(draft()).toHaveTextContent('oi');
  expect(draft().querySelector('.bubble')).toHaveClass('user');
  fireEvent.change(within(card).getByLabelText('Texto da mensagem'), {
    target: { value: 'Olá, quero agendar' },
  });
  expect(draft()).toHaveTextContent('Olá, quero agendar');
  expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Ver conversa' }));
  expect(
    screen.queryByLabelText('Prévia da mensagem em edição', { selector: '.draft-chat' }),
  ).toBeNull();
});
it('mostra uma nova etapa e reflete textos e botões em tempo real', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: '＋ Empresa' }));
  expect(draft()).toHaveTextContent('Nova mensagem');
  const card = screen.getByRole('article', { name: 'Etapa 6' });
  fireEvent.change(within(card).getByLabelText('Formato da mensagem'), {
    target: { value: 'buttons' },
  });
  fireEvent.change(within(card).getAllByLabelText('Texto do botão')[0], {
    target: { value: 'Fazer agendamento' },
  });
  expect(within(draft()).getByRole('button', { name: 'Fazer agendamento' })).toBeEnabled();
  fireEvent.click(within(draft()).getByRole('button', { name: 'Fazer agendamento' }));
  expect(within(draft()).getByRole('button', { name: 'Fazer agendamento' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
});
it('Ver conversa mostra todas as mensagens configuradas em ordem sem executar a jornada', async () => {
  await start([
    { id: 'user', type: 'user', text: 'oi', delay: 120 },
    { id: 'reply', type: 'business', text: 'Mensagem da empresa', delay: 120 },
    { ...createStep('flow'), id: 'flow', text: 'Convite do formulário' },
  ]);
  const original = window.whatsappFakeFlows!.getProject();
  fireEvent.click(screen.getByRole('article', { name: 'Etapa 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver conversa' }));
  expect(
    screen.queryByLabelText('Prévia da mensagem em edição', { selector: '.draft-chat' }),
  ).toBeNull();
  const overview = document.querySelector('.overview-chat')!;
  expect(
    Array.from(overview.querySelectorAll('.message-content p')).map((el) => el.textContent),
  ).toEqual(['oi', 'Mensagem da empresa', 'Convite do formulário']);
  expect(screen.queryByRole('button', { name: 'Enviar mensagem' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Abrir formulário' })).toBeDisabled();
  expect(window.whatsappFakeFlows!.getState().running).toBe(false);
  expect(window.whatsappFakeFlows!.getState().messages).toEqual([]);
  expect(window.whatsappFakeFlows!.getProject()).toEqual(original);
  // Playback is still an explicit, separate action.
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  expect(document.querySelector('.overview-chat')).toBeNull();
  expect(window.whatsappFakeFlows!.getState().running).toBe(true);
  expect(screen.getByLabelText('Mensagem', { selector: 'input' })).toBeInTheDocument();
});
it('permite visualizar mensagens incompletas sem validar ou executar a jornada', async () => {
  const step = createStep('business');
  if (step.type === 'flow') throw new Error('fixture');
  step.interactive = { kind: 'buttons', buttons: [{ id: 'a', title: '' }] };
  await start([step]);
  fireEvent.click(screen.getByRole('article', { name: 'Etapa 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver conversa' }));
  expect(window.whatsappFakeFlows!.getState().running).toBe(false);
  expect(document.querySelector('.overview-chat')).toHaveTextContent(step.text);
  expect(screen.getByRole('button', { name: 'Iniciar manual' })).toBeDisabled();
});
it('permite abrir uma lista em edição sem avançar nem enviar respostas na jornada', async () => {
  const step = createStep('business');
  if (step.type === 'flow') throw new Error('fixture');
  step.interactive = createInteractive('list');
  await start([step]);
  fireEvent.click(screen.getByRole('article', { name: 'Etapa 1' }));
  fireEvent.click(within(draft()).getByRole('button', { name: /Ver opções/ }));
  const picker = screen.getByRole('dialog', { name: 'Ver opções' });
  fireEvent.click(within(picker).getByRole('radio', { name: 'Agendamento' }));
  fireEvent.click(within(picker).getByRole('button', { name: 'Enviar' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
  expect(window.whatsappFakeFlows!.getState().running).toBe(false);
});
it('abre o formulário do Flow a partir da prévia da mensagem', async () => {
  await start([createStep('flow')]);
  fireEvent.click(screen.getByRole('article', { name: 'Etapa 1' }));
  fireEvent.click(within(draft()).getByRole('button', { name: 'Abrir formulário' }));
  const sheet = screen.getByRole('region', { name: 'Flow' });
  fireEvent.change(within(sheet).getByLabelText('Nome'), { target: { value: 'Cliente exemplo' } });
  fireEvent.click(within(sheet).getByRole('button', { name: 'Confirmar' }));
  expect(screen.queryByRole('region', { name: 'Flow' })).toBeNull();
  expect(window.whatsappFakeFlows!.getState().messages).toHaveLength(0);
});
it('preserva a conversa executada, reinicia a prévia e limpa a seleção removida', async () => {
  await start([{ id: 'a', type: 'business', text: 'Mensagem original', delay: 0 }]);
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  const card = screen.getByRole('article', { name: 'Etapa 1' });
  fireEvent.change(within(card).getByLabelText('Texto da mensagem'), {
    target: { value: 'Novo texto' },
  });
  expect(draft()).toHaveTextContent('Novo texto');
  fireEvent.click(screen.getByRole('button', { name: 'Ver conversa' }));
  expect(document.querySelector('.overview-chat')).toHaveTextContent('Novo texto');
  expect(window.whatsappFakeFlows!.getState().messages[0].text).toBe('Mensagem original');
  expect(window.whatsappFakeFlows!.getState().running).toBe(false);
  fireEvent.click(card);
  act(() => {
    window.whatsappFakeFlows!.reset();
  });
  expect(document.querySelectorAll('.bubble')).toHaveLength(0);
  fireEvent.click(card);
  fireEvent.click(within(card).getByRole('button', { name: 'Remover etapa' }));
  expect(screen.queryByRole('button', { name: 'Ver conversa' })).toBeNull();
});
