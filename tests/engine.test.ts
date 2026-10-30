import { describe, expect, it } from 'vitest';
import { resolve, condition, flatten, validateField, validateFlow } from '../src/core/engine';
import { createLegacyProject as createDefaultProject } from './fixtures/legacy-project';
import { createSession, advance } from '../src/features/flows/model';
import type { FlowStep } from '../src/core/types';
describe('motor e navegação', () => {
  it('resolve referências sem acessar protótipos', () => {
    const ctx = { data: { x: 'olá' }, form: { y: true } };
    expect(resolve('${data.x}', ctx)).toBe('olá');
    expect(resolve('${data.constructor.name}', ctx)).toBeUndefined();
    expect(condition("${data.x} == 'olá'", ctx)).toBe(true);
  });
  it('valida campos obrigatórios e números', () => {
    expect(validateField({ type: 'TextInput', required: true, label: 'Nome' }, '')).toContain(
      'Preencha',
    );
    expect(validateField({ type: 'TextInput', 'input-type': 'number' }, 'abc')).toContain(
      'números',
    );
  });
  it('navega pelos menus e preserva o payload', () => {
    const step = createDefaultProject().steps.find((s) => s.id === 'menu') as FlowStep;
    let session = createSession(step);
    session.form.main_option = 'agendamento';
    session = advance(session).session!;
    expect(
      flatten(step.flow.screens[1].layout.children, { data: session.data, form: {} }).some(
        (c) => c.name === 'agendamento_option',
      ),
    ).toBe(true);
    session.form.agendamento_option = 'consultas';
    session = advance(session).session!;
    session.form.canal_option = 'aguardar';
    expect(advance(session).complete).toEqual({
      assunto_principal: 'agendamento',
      tipo_agendamento: 'consultas',
      preferencia_canal: 'aguardar',
    });
  });
  it('omite o agendamento para outros assuntos', () => {
    const step = createDefaultProject().steps.find((s) => s.id === 'menu') as FlowStep;
    const session = createSession(step);
    session.form.main_option = 'financeiro';
    const next = advance(session).session!;
    expect(
      flatten(step.flow.screens[1].layout.children, { data: next.data, form: {} }).some(
        (c) => c.text === 'Informações Recebidas',
      ),
    ).toBe(true);
  });
  it('rejeita destinos inexistentes', () => {
    const step = createDefaultProject().steps.find((s) => s.id === 'menu') as FlowStep;
    step.flow.screens[0].layout.children.at(-1)!['on-click-action']!.next!.name = 'MISSING';
    expect(() => validateFlow(step.flow)).toThrow('destino');
  });
});
