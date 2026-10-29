import { Button } from '../../../components/ui/Button';
import { ControlIcon } from '../../../components/icons/ControlIcon';
export function PlaybackModeButton({
  automatic,
  disabled,
  onClick,
}: {
  automatic?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={automatic ? 'primary' : 'default'}
      className="playback-mode"
      aria-label={automatic ? '▶ Automático' : 'Iniciar manual'}
      disabled={disabled}
      onClick={onClick}
    >
      <ControlIcon name={automatic ? 'play' : 'manual'} />
      <span>
        <span className="mode-title">{automatic ? 'Automático' : 'Interagir'}</span>
        <small>{automatic ? 'Cursor e respostas animados' : 'Preencha e escolha as opções'}</small>
      </span>
    </Button>
  );
}
