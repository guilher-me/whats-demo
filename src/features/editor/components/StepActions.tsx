import { useT } from '../../../i18n';
import { IconButton } from '../../../components/ui/IconButton';
export type StepAction = 'up' | 'down' | 'copy' | 'delete';
export function StepActions({
  first,
  last,
  onAction,
}: {
  first: boolean;
  last: boolean;
  onAction: (action: StepAction) => void;
}) {
  const t = useT();

  return (
    <div className="step-actions" role="group" aria-label={t('editor.actions')}>
      <IconButton label={t('editor.up')} disabled={first} onClick={() => onAction('up')}>
        ↑
      </IconButton>
      <IconButton label={t('editor.down')} disabled={last} onClick={() => onAction('down')}>
        ↓
      </IconButton>
      <IconButton label={t('editor.duplicate')} onClick={() => onAction('copy')}>
        ⧉
      </IconButton>
      <IconButton label={t('editor.remove')} onClick={() => onAction('delete')}>
        ×
      </IconButton>
    </div>
  );
}
