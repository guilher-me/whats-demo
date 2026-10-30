import { t } from '../../i18n';
import type { RefObject } from 'react';
import type { BusinessInteractive } from '../../core/types';
import { automaticOption, isReplyButton } from '../../core/message-buttons';
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
  const option = automaticOption(message);
  if (!option) throw new Error(t('errors.missingOption'));
  const bubble = [
    ...(phone.current?.querySelectorAll<HTMLElement>('[data-message-id]') ?? []),
  ].find((n) => n.dataset.messageId === id);
  if (message.kind === 'buttons') {
    const findTarget = () =>
      [...(phone.current?.querySelectorAll<HTMLElement>('[data-choice-id]') ?? [])].find(
        (n) =>
          n.dataset.choiceId === option.id &&
          (bubble?.contains(n) ||
            n.closest<HTMLElement>('[data-buttons-for]')?.dataset.buttonsFor === id),
      ) ?? null;
    if (!findTarget()) {
      const expand = bubble?.querySelector<HTMLElement>('[data-open-buttons]') ?? null;
      await touch(expand, signal, () => expand?.click());
    }
    const target = findTarget();
    if (isReplyButton(option))
      await touch(target, signal, () => {
        // Use the same component handler so overflow sheets also close after selection.
        if (target) target.click();
        else reply(id, option.id);
      });
    else {
      await touch(target, signal, () => target?.click());
      const confirmAction =
        phone.current?.querySelector<HTMLElement>('[data-confirm-button-action]') ?? null;
      await touch(confirmAction, signal, () => confirmAction?.click());
    }
  } else {
    await touch(bubble?.querySelector<HTMLElement>('[data-open-list]') ?? null, signal, () =>
      open(id),
    );
    await read(
      messageOptions(message)
        .map((option) => `${option.title} ${option.description ?? ''}`)
        .join(' '),
      signal,
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
