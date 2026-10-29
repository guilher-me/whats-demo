import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/IconButton';
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
    <div className="playback">
      <Button disabled={disabled || running} onClick={onManual}>
        Iniciar manual
      </Button>
      <Button variant="primary" disabled={disabled || running} onClick={onAuto}>
        ▶ Automático
      </Button>
      <IconButton label="Parar reprodução" disabled={!running} onClick={onStop}>
        ■
      </IconButton>
      <IconButton label="Reiniciar prévia" onClick={onReset}>
        ↻
      </IconButton>
    </div>
  );
}
