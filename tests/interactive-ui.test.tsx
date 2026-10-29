// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createDefaultProject } from '../src/core/defaults';
import { createInteractive } from '../src/core/interactive';
import { STORAGE_KEY } from '../src/core/project';
import type { BusinessInteractive } from '../src/core/types';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
async function start(kind: BusinessInteractive['kind']) {
  const project = createDefaultProject();
  project.contact.avatar = '';
  const interactive = createInteractive(kind);
  interactive.autoReplyId = 'option-2';
  project.steps = [
    {
      id: 'interactive',
      type: 'business',
      text: 'Qual atendimento você precisa?',
      delay: 0,
      interactive,
    },
    { id: 'done', type: 'business', text: 'Resposta recebida.', delay: 0 },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  render(<App />);
  await act(async () => {});
}
it('permite criar e editar botões pelo painel sem JSON e bloqueia opções inválidas', async () => {
  await start('buttons');
  expect(screen.getAllByLabelText('Texto do botão')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: '＋ Adicionar botão' }));
  expect(screen.getAllByLabelText('Texto do botão')).toHaveLength(3);
  expect(screen.getByRole('button', { name: '＋ Adicionar botão' })).toBeDisabled();
  fireEvent.change(screen.getAllByLabelText('Texto do botão')[0], { target: { value: '' } });
  expect(screen.getByRole('button', { name: 'Iniciar manual' })).toBeDisabled();
  fireEvent.change(screen.getAllByLabelText('Texto do botão')[0], {
    target: { value: 'Novo botão' },
  });
  expect(screen.getByRole('button', { name: 'Iniciar manual' })).toBeEnabled();
});
it('preserva o rascunho incompleto ao recarregar sem liberar a reprodução', async () => {
  await start('buttons');
  fireEvent.change(screen.getAllByLabelText('Texto do botão')[0], { target: { value: '' } });
  cleanup();
  render(<App />);
  await act(async () => {});
  expect(screen.getAllByLabelText('Texto do botão')[0]).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Iniciar manual' })).toBeDisabled();
  expect(screen.getByText('2 etapas')).toBeInTheDocument();
});
it('aguarda a escolha manual e registra uma única resposta do cliente', async () => {
  await start('buttons');
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await tick(1);
  expect(document.querySelector('.messages')).not.toHaveTextContent('Resposta recebida.');
  const button = within(document.querySelector('.messages') as HTMLElement).getByRole('button', {
    name: 'Agendamento',
  });
  fireEvent.click(button);
  fireEvent.click(button);
  await tick(1);
  expect(document.querySelectorAll('.bubble.user')).toHaveLength(1);
  expect(document.querySelector('.bubble.user')).toHaveTextContent('Agendamento');
  expect(document.querySelector('.messages')).toHaveTextContent('Resposta recebida.');
});
it('abre, fecha e confirma uma lista sem avançar antes da confirmação', async () => {
  await start('list');
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await tick(1);
  fireEvent.click(screen.getByRole('button', { name: /Ver opções/ }));
  expect(screen.getByRole('dialog', { name: 'Ver opções' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Fechar lista' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Ver opções/ }));
  const picker = screen.getByRole('dialog', { name: 'Ver opções' });
  expect(within(picker).getByRole('button', { name: 'Enviar' })).toBeDisabled();
  fireEvent.click(within(picker).getByRole('radio', { name: 'Falar com atendente' }));
  expect(document.querySelector('.messages')).not.toHaveTextContent('Resposta recebida.');
  fireEvent.click(within(picker).getByRole('button', { name: 'Enviar' }));
  await tick(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.querySelector('.bubble.user')).toHaveTextContent('Falar com atendente');
  expect(document.querySelector('.messages')).toHaveTextContent('Resposta recebida.');
});
it.each(['buttons', 'list'] as const)(
  'anima %s e usa a resposta automática configurada',
  async (kind) => {
    await start(kind);
    fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
    for (let i = 0; i < 8; i++) await tick(1000);
    expect(document.querySelector('.play-status')).toHaveTextContent('Conversa concluída.');
    expect(document.querySelector('.bubble.user')).toHaveTextContent('Falar com atendente');
  },
);
it('parar fecha a lista, cancela a espera e permite uma nova reprodução', async () => {
  await start('list');
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
  await tick(1);
  fireEvent.click(screen.getByRole('button', { name: /Ver opções/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Fechar lista' }));
  fireEvent.click(screen.getByRole('button', { name: 'Parar reprodução' }));
  await tick(5000);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.querySelector('.messages')).not.toHaveTextContent('Resposta recebida.');
  fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
  await tick(8000);
  expect(document.querySelector('.play-status')).toHaveTextContent('Conversa concluída.');
});
