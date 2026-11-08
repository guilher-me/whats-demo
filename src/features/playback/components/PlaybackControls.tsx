import { useT } from '../../../i18n';
import { TooltipIconButton } from '../../../components/ui/TooltipIconButton';
import { useFirstPreviewHint } from '../hooks/useFirstPreviewHint';
import { ControlIcon } from '../../../components/icons/ControlIcon';
export function PlaybackControls({
  disabled,
  running,
  paused,
  locked = false,
  autoDisabled = false,
  showFirstVisitHint = false,
  onManual,
  onAuto,
  onPause,
  onResume,
  onReset,
}: {
  disabled: boolean;
  running: boolean;
  paused: boolean;
  locked?: boolean;
  autoDisabled?: boolean;
  showFirstVisitHint?: boolean;
  onManual: () => void;
  onAuto: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}) {
  const t = useT();
  const hint = useFirstPreviewHint(
    showFirstVisitHint && !running && !locked && !disabled && !autoDisabled,
  );

  return (
    <div
      className="playback"
      role="group"
      aria-label={t('playback.controls')}
      onFocusCapture={(event) => {
        if (hint.visible && !event.target.classList.contains('playback-auto')) hint.dismiss();
      }}
    >
      <TooltipIconButton
        label={running ? t(paused ? 'playback.resume' : 'playback.pause') : t('playback.manual')}
        description={
          running
            ? t(paused ? 'playback.resumeHint' : 'playback.pauseHint')
            : t('playback.manualHint')
        }
        disabled={locked || (!running && disabled)}
        aria-controls="phone-preview"
        onClick={running ? (paused ? onResume : onPause) : onManual}
      >
        <ControlIcon name={running ? (paused ? 'play' : 'pause') : 'manual'} />
      </TooltipIconButton>
      <TooltipIconButton
        label={running ? t('playback.reset') : t('playback.automatic')}
        description={running ? t('playback.resetHint') : t('playback.autoHint')}
        className="playback-auto"
        firstVisitHint={hint.visible ? t('playback.firstVisitHint') : undefined}
        disabled={locked || (!running && (disabled || autoDisabled))}
        aria-controls="phone-preview"
        onClick={running ? onReset : onAuto}
      >
        <ControlIcon name={running ? 'reset' : 'play'} />
      </TooltipIconButton>
    </div>
  );
}
