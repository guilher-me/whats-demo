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
              <IconButton label="Fechar lista">×</IconButton>
            </Dialog.Close>
          </header>
          <Dialog.Description className="visually-hidden">{description}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
