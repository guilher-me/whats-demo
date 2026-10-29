import { useCallback, useEffect, useRef, useState } from 'react';
import { AppHeader } from './AppHeader';
import { useProject } from '../features/editor/hooks/useProject';
import { EditorPanel } from '../features/editor/components/EditorPanel';
import { ShareButton } from '../features/sharing/ShareButton';
import { usePlayback } from '../features/playback/hooks/usePlayback';
import { PlaybackControls } from '../features/playback/components/PlaybackControls';
import { PhonePreview } from '../features/conversation/components/PhonePreview';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
export function App() {
  const editor = useProject(),
    phoneRef = useRef<HTMLDivElement>(null),
    playback = usePlayback(phoneRef);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({}),
    [recording, setRecording] = useState(false),
    [restoreOpen, setRestoreOpen] = useState(false);
  const onValidity = useCallback(
    (id: string, valid: boolean) =>
      setInvalid((current) => (current[id] === !valid ? current : { ...current, [id]: !valid })),
    [],
  );
  const hasErrors = editor.project.steps.some((step) => invalid[step.id]);
  useEffect(() => {
    playback.stop();
    setInvalid({});
  }, [editor.revision, playback.stop]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRecording(false);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const edit = (operation: () => void) => {
    if (playback.running) playback.stop();
    operation();
  };
  return (
    <div className={recording ? 'recording' : undefined}>
      <AppHeader status={hasErrors ? 'JSON pendente de correção' : editor.saveStatus}>
        <ShareButton
          project={editor.project}
          disabled={hasErrors || editor.loading}
          onError={editor.setError}
        />
      </AppHeader>
      <main className="workspace">
        <EditorPanel
          project={editor.project}
          revision={editor.revision}
          activeStep={playback.activeStep}
          error={editor.error}
          onContact={(contact) => editor.update((p) => ({ ...p, contact }))}
          onChange={(id, change) => edit(() => editor.updateStep(id, change))}
          onAction={(id, action) => edit(() => editor.action(id, action))}
          onAdd={(type) => edit(() => editor.add(type))}
          onRestore={() => setRestoreOpen(true)}
          onError={editor.setError}
          onValidity={onValidity}
        />
        <section className="preview" aria-label="Prévia da conversa">
          <div className="preview-heading">
            <div>
              <span className="eyebrow">02 / EXPERIMENTE</span>
              <h2>Prévia da conversa</h2>
            </div>
            <Button variant="ghost" onClick={() => setRecording(true)}>
              Só celular ↗
            </Button>
          </div>
          <PlaybackControls
            disabled={hasErrors || editor.loading || !editor.project.steps.length}
            running={playback.running}
            onManual={() => void playback.run(editor.project, false)}
            onAuto={() => void playback.run(editor.project, true)}
            onStop={playback.stop}
            onReset={playback.reset}
          />
          <p className="play-status" role="status" aria-live="polite">
            {playback.status}
          </p>
          <PhonePreview contact={editor.project.contact} playback={playback} phoneRef={phoneRef} />
          <p className="preview-note">Simulação local · sem envio ao WhatsApp</p>
          {recording && (
            <Button variant="ghost" onClick={() => setRecording(false)}>
              Sair da visualização · Esc
            </Button>
          )}
        </section>
      </main>
      <Dialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restaurar exemplo?"
        description="Copie o link antes se quiser guardar a sequência atual."
      >
        <div className="dialog-actions">
          <Button onClick={() => setRestoreOpen(false)}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => {
              edit(editor.restore);
              setRestoreOpen(false);
            }}
          >
            Restaurar exemplo
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
