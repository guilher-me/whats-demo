// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { createDefaultProject } from '../src/core/defaults';
import { STORAGE_KEY } from '../src/core/project';
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function start() {
  render(<App />);
  await act(async () => {});
}
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
describe('editor e reprodução React', () => {
  it('edita contato e adiciona mensagem', async () => {
    await start();
    fireEvent.change(screen.getByLabelText('Nome do contato'), {
      target: { value: 'Empresa teste' },
    });
    expect(screen.getByTitle('Empresa teste')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '＋ Empresa' }));
    expect(screen.getByText('6 etapas')).toBeInTheDocument();
  });
  it('não perde a mensagem manual durante o delay inicial e completa os dois Flows', async () => {
    const project = createDefaultProject();
    project.contact.avatar = '';
    project.steps.forEach((s) => (s.delay = s.type === 'user' ? 5 : 0));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    await start();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
    fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: 'oi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    await tick(1);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar meus dados' }));
    const sheet = screen.getByRole('region', { name: 'Flow' });
    fireEvent.click(within(sheet).getByLabelText('Li e aceito os termos.'));
    fireEvent.change(within(sheet).getByLabelText(/CPF ou Matrícula/), {
      target: { value: '12345' },
    });
    fireEvent.change(within(sheet).getByLabelText(/Data de Nascimento/), {
      target: { value: '1980-01-01' },
    });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Confirmar Dados' }));
    await tick(230);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar atendimento' }));
    fireEvent.click(screen.getByLabelText('Agendamento'));
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    fireEvent.click(screen.getByLabelText('Agendar Consultas'));
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    fireEvent.click(screen.getByLabelText('Aguardar Atendente'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Solicitação' }));
    await tick(230);
    expect(document.querySelector('.play-status')?.textContent).toBe('Conversa concluída.');
    expect(document.querySelector('.messages')?.textContent).toContain('Meu nome é Vanessa');
    expect(document.querySelector('.messages')?.textContent).toContain('Seu protocolo');
    expect(document.querySelector('.bubble strong')).toBeNull();
  });
  it('informa componente não suportado sem quebrar a interface', async () => {
    const p = createDefaultProject();
    p.contact.avatar = '';
    p.steps = [p.steps[1]];
    p.steps[0].delay = 0;
    if (p.steps[0].type === 'flow')
      p.steps[0].flow.screens[0].layout.children.unshift({ type: 'UnsupportedWidget' });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    await start();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar manual' }));
    await tick(1);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar meus dados' }));
    expect(screen.getAllByText(/Componente ainda não suportado/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Confirmar Dados' })).toBeDisabled();
  });
  it('cancela e reinicia sem mensagens atrasadas', async () => {
    const project = createDefaultProject();
    project.contact.avatar = '';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    await start();
    fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
    await tick(100);
    expect(window.whatsappFakeFlows!.getState().running).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar prévia' }));
    await tick(20000);
    expect(document.querySelectorAll('.bubble')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Reproduzir automaticamente' })).toBeEnabled();
  });
  it('executa a animação automática completa', async () => {
    const p = createDefaultProject();
    p.contact.avatar = '';
    p.steps.forEach((s) => (s.delay = 0));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    await start();
    fireEvent.click(screen.getByRole('button', { name: 'Reproduzir automaticamente' }));
    for (let i = 0; i < 45; i++) await tick(1000);
    expect(document.querySelector('.play-status')?.textContent).toBe('Conversa concluída.');
    expect(document.querySelector('.messages')?.textContent).toContain('Meu nome é Vanessa');
  });
});
