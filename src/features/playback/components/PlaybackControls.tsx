import { TooltipIconButton } from '../../../components/ui/TooltipIconButton';
import { ControlIcon } from '../../../components/icons/ControlIcon';
export function PlaybackControls({
  disabled,
  running,
  locked = false,
  onManual,
  onAuto,
  onStop,
  onReset,
}: {
  disabled: boolean;
  running: boolean;
  locked?: boolean;
  onManual: () => void;
  onAuto: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  return (
    <div className="playback" role="group" aria-label="Controles de reprodução">
      <TooltipIconButton
        label={running ? 'Parar reprodução' : 'Iniciar manual'}
        description={
          running
            ? 'Interrompe a conversa e mantém as mensagens exibidas.'
            : 'Preencha os campos e escolha as opções no celular.'
        }
        disabled={locked || (!running && disabled)}
        aria-controls="phone-preview"
        onClick={running ? onStop : onManual}
      >
        <ControlIcon name={running ? 'pause' : 'manual'} />
      </TooltipIconButton>
      <TooltipIconButton
        label={running ? 'Reiniciar prévia' : 'Reproduzir automaticamente'}
        description={
          running
            ? 'Interrompe a reprodução e limpa o histórico da prévia.'
            : 'Executa a jornada com cursor e respostas animados.'
        }
        className="playback-auto"
        disabled={locked || (!running && disabled)}
        aria-controls="phone-preview"
        onClick={running ? onReset : onAuto}
      >
        <ControlIcon name={running ? 'reset' : 'play'} />
      </TooltipIconButton>
    </div>
  );
}
