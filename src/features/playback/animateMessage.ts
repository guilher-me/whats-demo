import { t } from '../../i18n';
import type { RefObject } from 'react';
import type { BusinessInteractive } from '../../core/types';
import { messageOptions } from '../../core/interactive';
import type { useCursor } from './hooks/useCursor';

export async function animateMessage({
  id,
  message,
  phone,
  signal,
  touch,
  read,
  open,
  reply,
  select,
  confirm,
}: {
  id: string;
  message: BusinessInteractive;
  phone: RefObject<HTMLDivElement | null>;
  signal: AbortSignal;
  touch: ReturnType<typeof useCursor>['touch'];
  read: ReturnType<typeof useCursor>['read'];
  open: (id: string) => void;
  reply: (messageId: string, optionId: string) => void;
  select: (id: string) => void;
  confirm: () => void;
}) {
  const option =
    messageOptions(message).find((o) => o.id === message.autoReplyId) ?? messageOptions(message)[0];
  if (!option) throw new Error(t('errors.missingOption'));
  const bubble = [
    ...(phone.current?.querySelectorAll<HTMLElement>('[data-message-id]') ?? []),
  ].find((n) => n.dataset.messageId === id);
  if (message.kind === 'buttons') {
    const target =
      [...(bubble?.querySelectorAll<HTMLElement>('[data-choice-id]') ?? [])].find(
        (n) => n.dataset.choiceId === option.id,
      ) ?? null;
    await touch(target, signal, () => reply(id, option.id));
  } else {
    await touch(bubble?.querySelector<HTMLElement>('[data-open-list]') ?? null, signal, () =>
      open(id),
    );
    await read(
      messageOptions(message)
        .map((option) => `${option.title} ${option.description ?? ''}`)
        .join(' '),
      signal,
      phone.current?.querySelector<HTMLElement>('.phone-sheet'),
    );
    const target =
      [...(phone.current?.querySelectorAll<HTMLElement>('[data-list-option]') ?? [])].find(
        (n) => n.dataset.listOption === option.id,
      ) ?? null;
    await touch(target, signal, () => select(option.id));
    await touch(
      phone.current?.querySelector<HTMLElement>('[data-confirm-list]') ?? null,
      signal,
      confirm,
    );
  }
}
