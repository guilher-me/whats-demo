import { expect, it } from 'vitest';
import { createDefaultProject } from '../src/core/defaults';
import { createStep } from '../src/core/project';
import { createInteractive } from '../src/core/interactive';
import {
  conversationOverviewMessages,
  flowOverviewReply,
} from '../src/features/conversation/overview';
import type { FlowStep } from '../src/core/types';

it('inclui respostas de todos os Flows com títulos legíveis e na ordem da conversa', () => {
  const project = createDefaultProject();
  const original = JSON.stringify(project);
  const messages = conversationOverviewMessages(project);
  const identification = messages.find(
    (m) => m.direction === 'user' && m.text.includes('Identificação confirmada'),
  )!;
  expect(identification.text).toContain('Li e aceito os termos.');
  expect(identification.text).toContain('12345');
  expect(identification.text).toContain('1980-01-01');
  const menuReply = messages.find(
    (m) => m.direction === 'user' && m.text.includes('Solicitação enviada'),
  )!;
  expect(menuReply.text).toContain('Agendamento');
  expect(menuReply.text).toContain('Agendar Consultas');
  expect(menuReply.text).toContain('Aguardar Atendente');
  expect(menuReply.text).not.toContain('agendamento_option');
  const replyIndex = messages.indexOf(menuReply);
  expect(messages[replyIndex - 1].flowStep?.id).toBe('menu');
  expect(messages[replyIndex + 1].text).toContain('Seu protocolo');
  expect(JSON.stringify(project)).toBe(original);
});

it('respeita a condição do Flow e não mostra escolhas de telas ou campos ocultos', () => {
  const step = createDefaultProject().steps.find((s) => s.id === 'menu') as FlowStep;
  step.answers.main_option = 'financeiro';
  const reply = flowOverviewReply(step);
  expect(reply).toContain('Assuntos Financeiros');
  expect(reply).toContain('Aguardar Atendente');
  expect(reply).not.toContain('Agendar Consultas');
});

it('inclui também a escolha automática de botões e listas após a mensagem da empresa', () => {
  for (const kind of ['buttons', 'list'] as const) {
    const project = createDefaultProject();
    const interactive = createInteractive(kind);
    interactive.autoReplyId = 'option-2';
    project.steps = [{ id: 'choice', type: 'business', text: 'Escolha', delay: 0, interactive }];
    expect(conversationOverviewMessages(project).map((m) => [m.direction, m.text])).toEqual([
      ['business', 'Escolha'],
      ['user', 'Falar com atendente'],
    ]);
  }
});

it('tolera rascunhos inválidos e interrompe ciclos sem duplicar respostas', () => {
  const step = createStep('flow') as FlowStep;
  const footer = step.flow.screens[0].layout.children.find((c) => c.type === 'Footer')!;
  footer['on-click-action'] = { name: 'navigate', next: { type: 'screen', name: 'FORM_SCREEN' } };
  expect(flowOverviewReply(step)).toBe('Dados enviados\nNome: Cliente exemplo');
  step.flow.screens = [];
  expect(flowOverviewReply(step)).toBe('Dados enviados');
});
