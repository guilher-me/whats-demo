import { useT } from '../../i18n';
import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { IconButton } from './IconButton';
export function PhoneSheet({
  container,
  title,
  description,
  children,
  onClose,
}: {
  container: HTMLElement | null;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const t = useT();

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="phone-sheet-overlay" />
        <Dialog.Content className="phone-sheet">
          <header>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label={t('common.closeList')}>×</IconButton>
            </Dialog.Close>
          </header>
          <Dialog.Description className="visually-hidden">{description}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
