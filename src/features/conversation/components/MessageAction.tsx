import type { ButtonHTMLAttributes } from 'react';
export function MessageAction({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`message-action ${className}`} {...props}>
      {children}
    </button>
  );
}
