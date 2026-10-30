import { useId, type ReactNode } from 'react';
import { ControlIcon } from '../icons/ControlIcon';

/** A mounted disclosure keeps local JSON drafts and validation alive while collapsed. */
export function FormSection({
  title,
  summary,
  children,
  defaultOpen = false,
  className = '',
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <details className={`form-section ${className}`} open={defaultOpen || undefined}>
      <summary aria-controls={id}>
        <span>
          <strong>{title}</strong>
          {summary && <small>{summary}</small>}
        </span>
        <ControlIcon name="chevron" />
      </summary>
      <div id={id} className="form-section-body">
        {children}
      </div>
    </details>
  );
}
