import type { ReactNode } from 'react';
import { DeliveredIcon } from '../../../components/icons/WhatsAppIcons';
/** Composable bubble shell: content, metadata and actions remain independent. */
export function MessageFrame({
  id,
  direction,
  time,
  interactive,
  children,
  actions,
}: {
  id: string;
  direction: 'user' | 'business';
  time: string;
  interactive?: boolean;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article
      aria-label={direction === 'user' ? 'Mensagem do cliente' : 'Mensagem da empresa'}
      data-message-id={id}
      className={`bubble ${direction === 'user' ? 'user' : ''} ${interactive ? 'flow-card' : ''}`}
    >
      <div className="message-content">{children}</div>
      <time className="message-time" dateTime={time}>
        {time}
        {direction === 'user' && (
          <span className="message-receipt" role="img" aria-label="Mensagem entregue">
            <DeliveredIcon />
          </span>
        )}
      </time>
      {actions}
    </article>
  );
}
