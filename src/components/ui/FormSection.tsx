import { useId, useState, type ReactNode } from 'react';
import { ControlIcon } from '../icons/ControlIcon';

/** A mounted disclosure keeps local JSON drafts and validation alive while collapsed. */
export function FormSection({
  title,
  summary,
  leading,
  badge,
  name,
  children,
  defaultOpen = false,
  className = '',
  mountOnOpen = false,
}: {
  title: string;
  summary?: string;
  leading?: ReactNode;
  badge?: string;
  name?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  mountOnOpen?: boolean;
}) {
  const id = useId();
  const [opened, setOpened] = useState(defaultOpen);
  return (
    <details
      className={`form-section ${className}`}
      name={name}
      open={defaultOpen || undefined}
      onToggle={
        mountOnOpen && !opened
          ? (event) => {
              if (event.currentTarget.open) setOpened(true);
            }
          : undefined
      }
    >
      <summary aria-controls={id}>
        {leading}
        <span className="form-section-title">
          <strong>{title}</strong>
          {summary && <small>{summary}</small>}
        </span>
        {badge && <span className="form-section-badge">{badge}</span>}
        <ControlIcon name="chevron" />
      </summary>
      <div id={id} className="form-section-body">
        {(!mountOnOpen || opened) && children}
      </div>
    </details>
  );
}
