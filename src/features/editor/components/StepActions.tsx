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
  return (
    <div className="step-actions">
      <IconButton label="Mover para cima" disabled={first} onClick={() => onAction('up')}>
        ↑
      </IconButton>
      <IconButton label="Mover para baixo" disabled={last} onClick={() => onAction('down')}>
        ↓
      </IconButton>
      <IconButton label="Duplicar etapa" onClick={() => onAction('copy')}>
        ⧉
      </IconButton>
      <IconButton label="Remover etapa" onClick={() => onAction('delete')}>
        ×
      </IconButton>
    </div>
  );
}
