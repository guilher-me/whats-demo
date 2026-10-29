import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { ControlIcon } from '../../../components/icons/ControlIcon';
import { recordingSupport } from '../session';
import { formatElapsed } from '../types';
import type { RecordingController } from '../useRecording';
export function RecordingDialogs({
  open,
  onOpenChange,
  controller: recording,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  controller: RecordingController;
}) {
  const unsupported = recordingSupport();
  const choose = (mode: 'manual' | 'automatic') => {
    onOpenChange(false);
    void recording.start(mode);
  };
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Gravar o celular"
        description="A jornada será reiniciada. Após uma contagem de 3 segundos, apenas o celular será gravado, sem áudio ou controles."
      >
        <p className="record-format-note">
          MP4 quando disponível; WebM como alternativa. O vídeo é gerado localmente. Mantenha a aba
          visível durante a gravação.
        </p>
        {unsupported ? (
          <p role="alert">{unsupported}</p>
        ) : (
          <div className="record-mode-options">
            <Button onClick={() => choose('manual')}>
              <ControlIcon name="manual" />
              <span>
                Gravar manualmente
                <small>Interaja com a conversa e finalize pelo botão de gravação.</small>
              </span>
            </Button>
            <Button variant="primary" onClick={() => choose('automatic')}>
              <ControlIcon name="play" />
              <span>
                Gravar automaticamente
                <small>
                  O cursor percorre a jornada. A gravação termina 2 segundos após a última mensagem.
                </small>
              </span>
            </Button>
          </div>
        )}
      </Dialog>
      <Dialog
        open={!!recording.result}
        onOpenChange={(value) => {
          if (!value) recording.discard();
        }}
        title="Gravação pronta"
        description={
          recording.result
            ? `${recording.result.extension.toUpperCase()} · ${formatElapsed(recording.result.durationMs / 1000)} · ${recording.result.width} × ${recording.result.height} · sem áudio`
            : ''
        }
      >
        {recording.result && (
          <>
            <video
              className="recorded-video"
              controls
              muted
              playsInline
              preload="metadata"
              src={recording.result.url}
              aria-label="Vídeo da jornada gravada"
            />
            <div className="dialog-actions">
              <Button onClick={recording.discard}>Descartar</Button>
              <Button
                onClick={() => {
                  recording.discard();
                  onOpenChange(true);
                }}
              >
                Gravar novamente
              </Button>
              <a
                className="download-recording"
                href={recording.result.url}
                download={`whatsapp-fake-flows-${new Date().toISOString().replace(/[:.]/g, '-')}.${recording.result.extension}`}
              >
                Baixar vídeo
              </a>
            </div>
          </>
        )}
      </Dialog>
      <Dialog
        open={!!recording.error}
        onOpenChange={(value) => {
          if (!value) recording.clearError();
        }}
        title="Não foi possível gravar"
        description={recording.error}
      >
        <div className="dialog-actions">
          <Button onClick={recording.clearError}>Fechar</Button>
        </div>
      </Dialog>
    </>
  );
}
