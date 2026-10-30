import { t } from '../i18n';
import type {
  BusinessInteractive,
  MessageButton,
  MessageButtonType,
  MessageOption,
  ReplyButtonsMessage,
} from './types';

export const BUTTON_TYPES: MessageButtonType[] = [
  'quick_reply',
  'url',
  'phone_number',
  'copy_code',
  'voice_call',
];
export const buttonType = (button: MessageButton): MessageButtonType =>
  button.type ?? 'quick_reply';
export const isReplyButton = (button: MessageButton) => buttonType(button) === 'quick_reply';
export const buttonTitleLimit = (message: ReplyButtonsMessage, button: MessageButton) =>
  buttonType(button) === 'voice_call' || message.context !== 'template' ? 20 : 25;
export const buttonCountLimit = (message: ReplyButtonsMessage) =>
  message.context === 'template' ? 10 : message.buttons.every(isReplyButton) ? 3 : 1;
export const buttonLabel = (button: MessageButton) =>
  buttonType(button) === 'copy_code' ? t('buttons.copyCode') : button.title;
export function automaticOption(message: BusinessInteractive): MessageOption | undefined {
  const options =
    message.kind === 'buttons' ? message.buttons : message.sections.flatMap((s) => s.rows);
  const replies = message.kind === 'buttons' ? message.buttons.filter(isReplyButton) : options;
  const choices = replies.length ? replies : options;
  return choices.find((o) => o.id === message.autoReplyId) ?? choices[0];
}

/** Never pass shared-link URLs through to navigation without checking their scheme and credentials. */
export function safeButtonUrl(value: string): string | null {
  if (!/^https?:\/\//i.test(value) || value.length > 2000 || /[\u0000-\u0020\u007f{}]/.test(value))
    return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function buttonRulesError(message: ReplyButtonsMessage): string {
  const { buttons } = message;
  if (buttons.length > buttonCountLimit(message))
    return t(
      message.context === 'template'
        ? 'buttons.templateCountError'
        : buttons.every(isReplyButton)
          ? 'errors.buttonsCount'
          : 'buttons.interactiveMixError',
    );
  if (
    message.context !== 'template' &&
    buttons.some((b) => ['phone_number', 'copy_code'].includes(buttonType(b)))
  )
    return t('buttons.templateOnlyError');
  if (buttons.some((b) => [...b.title].length > buttonTitleLimit(message, b)))
    return t('buttons.titleError');
  if (
    buttons.filter((b) => buttonType(b) === 'url').length > 2 ||
    buttons.filter((b) => buttonType(b) === 'phone_number').length > 1 ||
    buttons.filter((b) => buttonType(b) === 'copy_code').length > 1
  )
    return t('buttons.typeCountError');
  // Meta requires quick replies and other actions to form at most two contiguous groups.
  const groups = buttons.reduce<boolean[]>((all, b) => {
    const reply = isReplyButton(b);
    if (!all.length || all[all.length - 1] !== reply) all.push(reply);
    return all;
  }, []);
  if (groups.length > 2) return t('buttons.groupError');
  if (buttons.some((b) => buttonType(b) === 'url' && !safeButtonUrl(b.url ?? '')))
    return t('buttons.urlError');
  if (
    buttons.some(
      (b) =>
        buttonType(b) === 'phone_number' &&
        (!/^\+?\d+$/.test(b.phoneNumber ?? '') || (b.phoneNumber?.length ?? 0) > 20),
    )
  )
    return t('buttons.phoneError');
  if (
    buttons.some(
      (b) => buttonType(b) === 'copy_code' && (!b.code?.trim() || [...b.code].length > 20),
    )
  )
    return t('buttons.codeError');
  if (
    buttons.some(
      (b) =>
        buttonType(b) === 'voice_call' &&
        b.ttlMinutes !== undefined &&
        (!Number.isInteger(b.ttlMinutes) ||
          b.ttlMinutes < (message.context === 'template' ? 1440 : 1) ||
          b.ttlMinutes > 43200),
    )
  )
    return t('buttons.ttlError');
  if (
    buttons.some(isReplyButton) &&
    message.autoReplyId &&
    !buttons.some((b) => b.id === message.autoReplyId && isReplyButton(b))
  )
    return t('buttons.autoReplyError');
  return '';
}

/** Validate the bounded shape separately so incomplete edits can be saved and shared. */
export function buttonShapeError(value: Record<string, unknown>): string {
  if (value.context !== undefined && !['interactive', 'template'].includes(String(value.context)))
    return t('buttons.contextError');
  for (const raw of value.buttons as unknown[]) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return t('errors.optionIds');
    const b = raw as Record<string, unknown>;
    if (b.type !== undefined && !BUTTON_TYPES.includes(b.type as MessageButtonType))
      return t('buttons.typeError');
    for (const [key, max] of [
      ['url', 2000],
      ['phoneNumber', 20],
      ['code', 20],
    ] as const) {
      if (
        b[key] !== undefined &&
        (typeof b[key] !== 'string' || [...(b[key] as string)].length > max)
      )
        return t('buttons.dataError');
    }
    if (
      b.ttlMinutes !== undefined &&
      (typeof b.ttlMinutes !== 'number' || !Number.isFinite(b.ttlMinutes))
    )
      return t('buttons.ttlError');
  }
  return '';
}
