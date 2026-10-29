import { describe, expect, it } from 'vitest';
import { createInteractive, interactiveError } from '../src/core/interactive';
import { validateProject } from '../src/core/engine';
import { normalizeProject } from '../src/core/project';
import { encode, decode } from '../src/core/codec';
import legacy from './fixtures/v1-project.json';
describe('mensagens interativas', () => {
  it('valida os limites de botões, títulos e identificadores', () => {
    const message = createInteractive('buttons');
    expect(interactiveError(message)).toBe('');
    if (message.kind !== 'buttons') throw new Error('fixture');
    message.buttons.push(
      { id: 'three', title: 'Outra opção' },
      { id: 'four', title: 'Quarta opção' },
    );
    expect(interactiveError(message)).toContain('1 a 3');
    message.buttons = [{ id: 'a', title: 'a'.repeat(21) }];
    expect(interactiveError(message)).toContain('título');
    message.buttons = [
      { id: 'a', title: 'Primeiro' },
      { id: 'a', title: 'Segundo' },
    ];
    expect(interactiveError(message)).toContain('único');
  });
  it('conta opções em todas as seções e rejeita descrições longas', () => {
    const message = createInteractive('list');
    if (message.kind !== 'list') throw new Error('fixture');
    message.sections = [0, 1].map((section) => ({
      title: `Seção ${section}`,
      rows: Array.from({ length: 6 }, (_, i) => ({ id: `${section}-${i}`, title: `Opção ${i}` })),
    }));
    expect(interactiveError(message)).toContain('10 opções');
    message.sections = [
      { title: '', rows: [{ id: 'a', title: 'Opção', description: 'x'.repeat(73) }] },
    ];
    expect(interactiveError(message)).toContain('72');
    message.sections[0].rows[0].description = '';
    message.autoReplyId = 'missing';
    expect(interactiveError(message)).toContain('automática existente');
  });
  it('rejeita estruturas externas malformadas e mensagens no remetente errado', () => {
    expect(interactiveError({ kind: 'list', button: 'Abrir', sections: [null] })).not.toBe('');
    const project = normalizeProject(legacy);
    if (project.steps[0].type === 'flow') throw new Error('fixture');
    project.steps[0].interactive = createInteractive('buttons');
    expect(() => validateProject(project)).toThrow('Somente mensagens da empresa');
  });
  it('preserva mensagens interativas nos links sem mudar os projetos antigos', async () => {
    const project = normalizeProject(legacy);
    project.steps = [
      {
        id: 'list',
        type: 'business',
        text: 'Escolha uma opção',
        delay: 1,
        interactive: createInteractive('list'),
      },
    ];
    expect(normalizeProject(await decode(await encode(project)))).toEqual(project);
    expect(normalizeProject(legacy)).toEqual(legacy);
  });
});
