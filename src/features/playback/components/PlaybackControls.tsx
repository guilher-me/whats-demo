import { useT } from '../../../i18n';
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
  const t = useT();

  return (
    <div className="playback" role="group" aria-label={t('playback.controls')}>
      <TooltipIconButton
        label={running ? t('playback.stop') : t('playback.manual')}
        description={running ? t('playback.stopHint') : t('playback.manualHint')}
        disabled={locked || (!running && disabled)}
        aria-controls="phone-preview"
        onClick={running ? onStop : onManual}
      >
        <ControlIcon name={running ? 'pause' : 'manual'} />
      </TooltipIconButton>
      <TooltipIconButton
        label={running ? t('playback.reset') : t('playback.automatic')}
        description={running ? t('playback.resetHint') : t('playback.autoHint')}
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
