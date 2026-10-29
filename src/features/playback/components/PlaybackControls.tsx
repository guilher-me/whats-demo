import { IconButton } from '../../../components/ui/IconButton';
import { PlaybackModeButton } from './PlaybackModeButton';
import { ControlIcon } from '../../../components/icons/ControlIcon';
export function PlaybackControls({
  disabled,
  running,
  onManual,
  onAuto,
  onStop,
  onReset,
}: {
  disabled: boolean;
  running: boolean;
  onManual: () => void;
  onAuto: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  return (
    <div className="playback" aria-label="Controles da prévia">
      <div className="playback-heading">
        <span>REPRODUÇÃO</span>
        <small>
          <i className={running ? 'status-dot active' : 'status-dot'} />
          {running ? 'Em andamento' : 'Pronto para começar'}
        </small>
      </div>
      <div className="playback-modes">
        <PlaybackModeButton disabled={disabled || running} onClick={onManual} />
        <PlaybackModeButton automatic disabled={disabled || running} onClick={onAuto} />
      </div>
      <div className="playback-actions">
        <span>
          {running ? 'Interrompa para editar o roteiro' : 'Escolha como experimentar a conversa'}
        </span>
        <IconButton label="Parar reprodução" disabled={!running} onClick={onStop}>
          <ControlIcon name="stop" />
        </IconButton>
        <IconButton label="Reiniciar prévia" onClick={onReset}>
          <ControlIcon name="reset" />
        </IconButton>
      </div>
    </div>
  );
}
