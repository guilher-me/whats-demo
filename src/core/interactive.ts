import { t } from '../i18n';
import { buttonRulesError, buttonShapeError } from './message-buttons';
import type { ReplyButtonsMessage } from './types';
import type { BusinessInteractive, MessageOption, MessageStep } from './types';

export function businessMessageError(step: Pick<MessageStep, 'text' | 'interactive'>): string {
  if (!step.interactive) return '';
  return (
    interactiveError(step.interactive) ||
    (!step.text.trim()
      ? t('errors.messageRequired')
      : [...step.text].length > 1024
        ? t('errors.textLength')
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
    { id: 'option-1', title: t('seed.appointment') },
    { id: 'option-2', title: t('seed.agent') },
  ];
  return kind === 'buttons'
    ? { kind, buttons: options }
    : {
        kind,
        button: t('seed.viewOptions'),
        sections: [{ title: t('seed.service'), rows: options }],
      };
}

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max: number, required = false) =>
  typeof value === 'string' && [...value].length <= max && (!required || !!value.trim());

/** Validate untrusted saved projects as well as current editor drafts. */
export function interactiveError(input: unknown, { allowDrafts = false } = {}): string {
  if (!object(input) || !['buttons', 'list'].includes(String(input.kind)))
    return t('errors.interactiveFormat');
  if (input.header !== undefined && !text(input.header, 60)) return t('errors.headerLength');
  if (input.footer !== undefined && !text(input.footer, 60)) return t('errors.footerLength');
  let options: unknown[];
  if (input.kind === 'buttons') {
    if (
      !Array.isArray(input.buttons) ||
      input.buttons.length < 1 ||
      input.buttons.length > (allowDrafts || input.context === 'template' ? 10 : 3)
    )
      return t(input.context === 'template' ? 'buttons.templateCountError' : 'errors.buttonsCount');
    const shapeError = buttonShapeError(input);
    if (shapeError) return shapeError;
    options = input.buttons;
  } else {
    if (!text(input.button, 20, !allowDrafts)) return t('errors.listButton');
    if (!Array.isArray(input.sections) || !input.sections.length || input.sections.length > 10)
      return t('errors.sectionsCount');
    options = [];
    for (const section of input.sections) {
      if (
        !object(section) ||
        !text(section.title, 24, !allowDrafts && input.sections.length > 1) ||
        !Array.isArray(section.rows) ||
        !section.rows.length
      )
        return t('errors.section');
      options.push(...section.rows);
    }
    if (options.length > 10) return t('errors.listCount');
  }
  const ids = new Set<string>(),
    titles = new Set<string>();
  for (const option of options) {
    if (
      !object(option) ||
      !text(option.id, input.kind === 'buttons' ? 256 : 200, true) ||
      !text(
        option.title,
        input.kind === 'buttons' ? (allowDrafts || input.context === 'template' ? 25 : 20) : 24,
        !allowDrafts,
      )
    )
      return t('errors.optionIds');
    if (ids.has(option.id as string)) return t('errors.uniqueId');
    if (
      !allowDrafts &&
      input.kind === 'buttons' &&
      input.context !== 'template' &&
      titles.has(option.title as string)
    )
      return t('errors.uniqueTitles');
    if (option.description !== undefined && !text(option.description, 72))
      return t('errors.descriptionLength');
    ids.add(option.id as string);
    titles.add(option.title as string);
  }
  if (
    input.autoReplyId !== undefined &&
    (typeof input.autoReplyId !== 'string' || (input.autoReplyId && !ids.has(input.autoReplyId)))
  )
    return t('errors.autoReply');
  return !allowDrafts && input.kind === 'buttons'
    ? buttonRulesError(input as unknown as ReplyButtonsMessage)
    : '';
}
