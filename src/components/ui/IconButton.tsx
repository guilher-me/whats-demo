import { Button, type ButtonProps } from './Button';
export function IconButton({ label, ...props }: ButtonProps & { label: string }) {
  return (
    <Button
      variant="ghost"
      aria-label={label}
      title={label}
      {...props}
      className={`icon-button ${props.className ?? ''}`}
    />
  );
}
