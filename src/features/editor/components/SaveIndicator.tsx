import { useId, useState } from 'react';
import { useT, type MessageKey } from '../../../i18n';
import type { SaveState } from '../hooks/useProject';

const labels: Record<SaveState, MessageKey> = {
  example: 'storage.example',
  recovered: 'storage.recovered',
  saving: 'storage.saving',
  saved: 'storage.saved',
  failed: 'storage.failed',
  shared: 'storage.shared',
};
const help: Record<SaveState, MessageKey> = {
  example: 'storage.exampleHelp',
  recovered: 'storage.localOnly',
  saving: 'storage.savingHelp',
  saved: 'storage.localOnly',
  failed: 'storage.failureHelp',
  shared: 'storage.sharedHelp',
};
/** Project-wide persistence status beneath the app name; sharing remains a separate action. */
export function SaveIndicator({ state }: { state: SaveState }) {
  const t = useT();
  const id = useId();
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false),
    [dismissed, setDismissed] = useState(false);
  const open = (hovered || focused) && !dismissed;
  return (
    <span
      className="save-indicator"
      data-state={state}
      tabIndex={0}
      aria-describedby={open ? id : undefined}
      onMouseEnter={() => {
        setHovered(true);
        setDismissed(false);
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        setFocused(true);
        setDismissed(false);
      }}
      onBlur={() => setFocused(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          setDismissed(true);
        }
      }}
    >
      <span role="status" aria-live="polite">
        <span aria-hidden="true">
          {state === 'saved' || state === 'recovered' ? '✓' : state === 'failed' ? '!' : '○'}{' '}
        </span>
        {t(labels[state])}
      </span>
      {open && (
        <span id={id} className="save-tooltip" role="tooltip">
          {t(help[state])}
        </span>
      )}
    </span>
  );
}
