import { useT } from '../../i18n';
import * as Primitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { IconButton } from './IconButton';
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  onReturnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  trigger?: ReactNode;
  onReturnFocus?: () => void;
}) {
  const t = useT();

  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>}
      <Primitive.Portal>
        <Primitive.Overlay className="dialog-overlay" />
        <Primitive.Content
          className="dialog-content"
          onCloseAutoFocus={(event) => {
            if (!onReturnFocus) return;
            event.preventDefault();
            onReturnFocus();
          }}
        >
          <Primitive.Title>{title}</Primitive.Title>
          <Primitive.Description>{description ?? ' '}</Primitive.Description>
          <Primitive.Close asChild>
            <IconButton label={t('common.closeDialog')} className="dialog-close">
              ×
            </IconButton>
          </Primitive.Close>
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
