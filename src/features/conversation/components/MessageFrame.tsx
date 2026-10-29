import type { ReactNode } from 'react';
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
    <div
      data-message-id={id}
      className={`bubble ${direction === 'user' ? 'user' : ''} ${interactive ? 'flow-card' : ''}`}
    >
      <div className="message-content">{children}</div>
      <small className="message-time">
        {time}
        {direction === 'user' && '  ✓✓'}
      </small>
      {actions}
    </div>
  );
}
