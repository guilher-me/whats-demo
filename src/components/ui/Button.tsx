import type { ButtonHTMLAttributes } from 'react';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
}
export function Button({
  variant = 'default',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={`button button--${variant} ${className}`} {...props} />;
}
