import { useId, useRef, useState } from 'react';
import { IconButton } from './IconButton';
import type { ButtonProps } from './Button';
export function TooltipIconButton({
  label,
  description,
  ...props
}: ButtonProps & { label: string; description: string }) {
  const id = useId();
  const pointerFocus = useRef(false);
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
      onPointerDownCapture={() => {
        pointerFocus.current = true;
        setDismissed(true);
      }}
      onClickCapture={() => setDismissed(true)}
      onFocusCapture={() => {
        setFocused(true);
        if (!pointerFocus.current) setDismissed(false);
      }}
      onBlurCapture={() => {
        pointerFocus.current = false;
        setFocused(false);
      }}
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
