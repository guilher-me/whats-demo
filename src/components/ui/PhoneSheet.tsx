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
  closeLabel,
  onReturnFocus,
  className,
  hideHeader,
  backdrop,
}: {
  container: HTMLElement | null;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  onReturnFocus?: () => void;
  className?: string;
  hideHeader?: boolean;
  backdrop?: 'clear' | 'dimmed';
}) {
  const t = useT();

  return (
    <Dialog.Root
      open
      modal={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal container={container}>
        {backdrop ? (
          <div
            aria-hidden="true"
            className={`phone-sheet-overlay${backdrop === 'clear' ? ' clear' : ''}`}
            onClick={onClose}
          />
        ) : (
          <Dialog.Overlay className="phone-sheet-overlay" />
        )}
        <Dialog.Content
          className={className ? `phone-sheet ${className}` : 'phone-sheet'}
          onInteractOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={
            onReturnFocus
              ? (event) => {
                  event.preventDefault();
                  onReturnFocus();
                }
              : undefined
          }
        >
          {hideHeader ? (
            <Dialog.Title className="visually-hidden">{title}</Dialog.Title>
          ) : (
            <header>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Close asChild>
                <IconButton label={closeLabel ?? t('common.closeList')}>×</IconButton>
              </Dialog.Close>
            </header>
          )}
          <Dialog.Description className="visually-hidden">{description}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
