import { useT } from '../../../i18n';
import { useState } from 'react';
import { TooltipIconButton } from '../../../components/ui/TooltipIconButton';
import { ControlIcon } from '../../../components/icons/ControlIcon';
import { formatElapsed } from '../types';
import type { RecordingController } from '../useRecording';
import { RecordingDialogs } from './RecordingDialogs';
export function RecordingControls({
  controller: recording,
  disabled,
}: {
  controller: RecordingController;
  disabled: boolean;
}) {
  const t = useT();

  const [open, setOpen] = useState(false);
  const readyToStop = recording.phase === 'recording';
  const label =
    recording.phase === 'finishing'
      ? t('recording.finishing')
      : readyToStop
        ? t('recording.finish')
        : recording.busy
          ? t('recording.cancel')
          : t('recording.record');
  return (
    <>
      <div
        className={`record-control ${recording.busy ? 'recording-active' : ''}`}
        role="group"
        aria-label={t('recording.region')}
        data-recording-exclude
      >
        <TooltipIconButton
          label={label}
          description={
            readyToStop
              ? t('recording.finishHint')
              : recording.busy
                ? t('recording.cancelHint')
                : t('recording.hint')
          }
          disabled={recording.phase === 'finishing' || (!recording.busy && disabled)}
          aria-controls="phone-preview"
          onClick={() => {
            if (readyToStop) void recording.finish();
            else if (recording.busy) recording.cancel();
            else setOpen(true);
          }}
        >
          <ControlIcon name={readyToStop ? 'stop' : 'record'} />
        </TooltipIconButton>
        {recording.busy && (
          <output className="record-clock" aria-label={t('recording.elapsed')} aria-live="off">
            {recording.phase === 'countdown'
              ? String(recording.countdown)
              : recording.phase === 'preparing' || recording.phase === 'finishing'
                ? '…'
                : formatElapsed(recording.elapsed)}
          </output>
        )}
      </div>
      <span className="visually-hidden" role="status">
        {recording.phase === 'countdown'
          ? t('recording.countdown', { v0: recording.countdown })
          : recording.phase === 'recording'
            ? t('recording.active')
            : recording.phase === 'finishing'
              ? t('recording.finishing')
              : ''}
      </span>
      <RecordingDialogs open={open} onOpenChange={setOpen} controller={recording} />
    </>
  );
}
