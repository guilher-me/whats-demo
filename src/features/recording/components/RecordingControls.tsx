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
  const [open, setOpen] = useState(false);
  const readyToStop = recording.phase === 'recording';
  const label =
    recording.phase === 'finishing'
      ? 'Finalizando gravação'
      : readyToStop
        ? 'Finalizar gravação'
        : recording.busy
          ? 'Cancelar gravação'
          : 'Gravar celular';
  return (
    <>
      <div
        className={`record-control ${recording.busy ? 'recording-active' : ''}`}
        role="group"
        aria-label="Gravação do celular"
        data-recording-exclude
      >
        <TooltipIconButton
          label={label}
          description={
            readyToStop
              ? 'Finaliza o vídeo e abre a prévia para baixar.'
              : recording.busy
                ? 'Cancela a preparação e descarta esta gravação.'
                : 'Gera um vídeo apenas do celular, em modo manual ou automático.'
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
          <output className="record-clock" aria-label="Tempo de gravação" aria-live="off">
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
          ? `Gravação começa em ${recording.countdown}`
          : recording.phase === 'recording'
            ? 'Gravação em andamento'
            : recording.phase === 'finishing'
              ? 'Finalizando gravação'
              : ''}
      </span>
      <RecordingDialogs open={open} onOpenChange={setOpen} controller={recording} />
    </>
  );
}
