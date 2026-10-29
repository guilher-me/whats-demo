import { useT } from '../../../i18n';
import type { ReactNode } from 'react';
import { MessageReceipt } from './MessageReceipt';
/** Composable bubble shell: content, metadata and actions remain independent. */
export function MessageFrame({
  id,
  direction,
  time,
  receipt,
  interactive,
  children,
  actions,
}: {
  id: string;
  direction: 'user' | 'business';
  time: string;
  receipt?: 'delivered' | 'read';
  interactive?: boolean;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const t = useT();

  return (
    <article
      aria-label={direction === 'user' ? t('editor.customerMessage') : t('editor.businessMessage')}
      data-message-id={id}
      className={`bubble ${direction === 'user' ? 'user' : ''} ${interactive ? 'flow-card' : ''}`}
    >
      <div className="message-content">{children}</div>
      <time className="message-time" dateTime={time}>
        {time}
        {direction === 'user' && <MessageReceipt status={receipt} />}
      </time>
      {actions}
    </article>
  );
}
