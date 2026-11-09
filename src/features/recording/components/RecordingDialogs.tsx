import { useId, useState } from 'react';
import { useT } from '../../../i18n';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { ControlIcon } from '../../../components/icons/ControlIcon';
import { recordingSupport, supportsTransparentRecording } from '../session';
import { formatElapsed } from '../types';
import { RecordingResult } from './RecordingResult';
import type { RecordingController } from '../useRecording';
export function RecordingDialogs({
  open,
  onOpenChange,
  controller: recording,
  autoDisabled = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  controller: RecordingController;
  autoDisabled?: boolean;
}) {
  const t = useT();

  const unsupported = recordingSupport();
  const supportsTransparency = supportsTransparentRecording();
  const [transparent, setTransparent] = useState(false);
  const formatNote = useId();
  const choose = (mode: 'manual' | 'automatic') => {
    onOpenChange(false);
    void recording.start(mode, transparent && supportsTransparency);
  };
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('recording.title')}
        description={t('recording.description')}
      >
        {unsupported ? (
          <p role="alert">{unsupported}</p>
        ) : (
          <>
            <label className="record-transparent-option">
              <input
                type="checkbox"
                checked={transparent && supportsTransparency}
                disabled={!supportsTransparency}
                aria-describedby={formatNote}
                onChange={(event) => setTransparent(event.currentTarget.checked)}
              />
              {t('recording.transparent')}
            </label>
            <p id={formatNote} className="record-format-note">
              {t(
                transparent && supportsTransparency
                  ? 'recording.transparentHint'
                  : 'recording.formatHint',
              )}
              {!supportsTransparency && ' ' + t('recording.transparentUnavailable')}
            </p>
            <div className="record-mode-options">
              <Button onClick={() => choose('manual')}>
                <ControlIcon name="manual" />
                <span>
                  {t('recording.manual')}
                  <small>{t('recording.manualHint')}</small>
                </span>
              </Button>
              <Button variant="primary" disabled={autoDisabled} onClick={() => choose('automatic')}>
                <ControlIcon name="play" />
                <span>
                  {t('recording.automatic')}
                  <small>{t('recording.autoHint')}</small>
                </span>
              </Button>
            </div>
          </>
        )}
      </Dialog>
      <Dialog
        open={!!recording.result}
        onOpenChange={(value) => {
          if (!value) recording.discard();
        }}
        title={t('recording.ready')}
        description={
          recording.result
            ? t('recording.resultInfo', {
                v0: recording.result.extension.toUpperCase(),
                v1: formatElapsed(recording.result.durationMs / 1000),
                v2: recording.result.width,
                v3: recording.result.height,
              })
            : ''
        }
      >
        {recording.result && (
          <RecordingResult
            key={recording.result.url}
            clip={recording.result}
            onDiscard={recording.discard}
            onAgain={() => {
              recording.discard();
              onOpenChange(true);
            }}
          />
        )}
      </Dialog>
      <Dialog
        open={!!recording.error}
        onOpenChange={(value) => {
          if (!value) recording.clearError();
        }}
        title={t('recording.failedTitle')}
        description={recording.error}
      >
        <div className="dialog-actions">
          <Button onClick={recording.clearError}>{t('common.close')}</Button>
        </div>
      </Dialog>
    </>
  );
}
