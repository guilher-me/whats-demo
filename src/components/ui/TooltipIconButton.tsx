import { useId, useState } from 'react';
import { IconButton } from './IconButton';
import type { ButtonProps } from './Button';
export function TooltipIconButton({
  label,
  description,
  ...props
}: ButtonProps & { label: string; description: string }) {
  const id = useId();
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false),
    [dismissed, setDismissed] = useState(false);
  const open = (hovered || focused) && !dismissed;
  return (
    <span
      className="tooltip-anchor"
      onMouseEnter={() => {
        setHovered(true);
        setDismissed(false);
      }}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => {
        setFocused(true);
        setDismissed(false);
      }}
      onBlurCapture={() => setFocused(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          setDismissed(true);
        }
      }}
    >
      <IconButton
        {...props}
        label={label}
        title={undefined}
        aria-describedby={open ? id : undefined}
      />
      {open && (
        <span id={id} className="control-tooltip" role="tooltip">
          <span className="tooltip-title">{label}</span>
          {description}
        </span>
      )}
    </span>
  );
}
