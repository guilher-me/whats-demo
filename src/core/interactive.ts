import type { BusinessInteractive, MessageOption, MessageStep } from './types';

export function businessMessageError(step: Pick<MessageStep, 'text' | 'interactive'>): string {
  if (!step.interactive) return '';
  return (
    interactiveError(step.interactive) ||
    (!step.text.trim()
      ? 'Escreva o texto da mensagem.'
      : [...step.text].length > 1024
        ? 'Use até 1024 caracteres no texto.'
        : '')
  );
}

export const MESSAGE_LIMITS = {
  buttons: 3,
  buttonTitle: 20,
  sections: 10,
  rows: 10,
  rowTitle: 24,
  description: 72,
  sectionTitle: 24,
  header: 60,
  footer: 60,
} as const;

export function messageOptions(message: BusinessInteractive): MessageOption[] {
  return message.kind === 'buttons' ? message.buttons : message.sections.flatMap((s) => s.rows);
}

export function createInteractive(kind: BusinessInteractive['kind']): BusinessInteractive {
  const options = [
    { id: 'option-1', title: 'Agendamento' },
    { id: 'option-2', title: 'Falar com atendente' },
  ];
  return kind === 'buttons'
    ? { kind, buttons: options }
    : { kind, button: 'Ver opções', sections: [{ title: 'Atendimento', rows: options }] };
}

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max: number, required = false) =>
  typeof value === 'string' && [...value].length <= max && (!required || !!value.trim());

/** Validate untrusted saved projects as well as current editor drafts. */
export function interactiveError(input: unknown, { allowDrafts = false } = {}): string {
  if (!object(input) || !['buttons', 'list'].includes(String(input.kind)))
    return 'Formato de mensagem interativa inválido.';
  if (input.header !== undefined && !text(input.header, 60))
    return 'O cabeçalho aceita até 60 caracteres.';
  if (input.footer !== undefined && !text(input.footer, 60))
    return 'O rodapé aceita até 60 caracteres.';
  let options: unknown[];
  if (input.kind === 'buttons') {
    if (!Array.isArray(input.buttons) || input.buttons.length < 1 || input.buttons.length > 3)
      return 'Use de 1 a 3 botões de resposta.';
    options = input.buttons;
  } else {
    if (!text(input.button, 20, !allowDrafts))
      return 'O botão da lista deve ter de 1 a 20 caracteres.';
    if (!Array.isArray(input.sections) || !input.sections.length || input.sections.length > 10)
      return 'Use de 1 a 10 seções na lista.';
    options = [];
    for (const section of input.sections) {
      if (
        !object(section) ||
        !text(section.title, 24, !allowDrafts && input.sections.length > 1) ||
        !Array.isArray(section.rows) ||
        !section.rows.length
      )
        return 'Cada seção precisa de opções e, quando há várias seções, de um título de até 24 caracteres.';
      options.push(...section.rows);
    }
    if (options.length > 10) return 'A lista aceita até 10 opções no total.';
  }
  const ids = new Set<string>(),
    titles = new Set<string>();
  for (const option of options) {
    if (
      !object(option) ||
      !text(option.id, input.kind === 'buttons' ? 256 : 200, true) ||
      !text(option.title, input.kind === 'buttons' ? 20 : 24, !allowDrafts)
    )
      return 'Confira o identificador e o título das opções.';
    if (ids.has(option.id as string)) return 'Cada opção precisa de um identificador único.';
    if (!allowDrafts && input.kind === 'buttons' && titles.has(option.title as string))
      return 'Os títulos dos botões devem ser diferentes.';
    if (option.description !== undefined && !text(option.description, 72))
      return 'A descrição aceita até 72 caracteres.';
    ids.add(option.id as string);
    titles.add(option.title as string);
  }
  if (
    input.autoReplyId !== undefined &&
    (typeof input.autoReplyId !== 'string' || (input.autoReplyId && !ids.has(input.autoReplyId)))
  )
    return 'Escolha uma resposta automática existente.';
  return '';
}
