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
import { businessMessageError } from '../core/interactive';
import { createDefaultProject } from '../core/defaults';
import { useAutomationAPI } from '../features/automation/useAutomationAPI';
import { MessagePreview } from '../features/conversation/components/MessagePreview';
import { createStep } from '../core/project';
export function App() {
  const editor = useProject(),
    phoneRef = useRef<HTMLDivElement>(null),
    playback = usePlayback(phoneRef);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({}),
    [recording, setRecording] = useState(false),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [restoreOpen, setRestoreOpen] = useState(false);
  const onValidity = useCallback(
    (id: string, valid: boolean) =>
      setInvalid((current) => (current[id] === !valid ? current : { ...current, [id]: !valid })),
    [],
  );
  const hasErrors = editor.project.steps.some((step) =>
    step.type === 'business'
      ? !!businessMessageError(step)
      : step.type === 'flow' && invalid[step.id],
  );
  const selectedStep = !playback.running
    ? editor.project.steps.find((step) => step.id === selectedId)
    : undefined;
  const run = (project: typeof editor.project, automatic: boolean) => {
    setSelectedId(null);
    return playback.run(project, automatic);
  };
  useAutomationAPI({
    project: () => editor.project,
    state: () => ({
      ready: !editor.loading,
      running: playback.running,
      status: playback.status,
      activeStep: playback.activeStep,
      flowScreen: playback.flow?.step.flow.screens[playback.flow.index]?.id ?? null,
      pendingMessageId: playback.interaction.pendingId,
      messages: playback.messages,
    }),
    hasErrors: () => hasErrors,
    replace: (project) => {
      setSelectedId(null);
      playback.reset();
      editor.replace(project);
    },
    run,
    stop: playback.stop,
    reset: () => {
      setSelectedId(null);
      playback.reset();
    },
    example: createDefaultProject,
    instructions: () => document.getElementById('llms-txt')?.textContent ?? '',
    href: () => location.href,
  });
  useEffect(() => {
    playback.stop();
    setInvalid({});
    setSelectedId(null);
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
      <AppHeader status={hasErrors ? 'Há campos que precisam de correção' : editor.saveStatus}>
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
          selectedStep={selectedStep?.id ?? null}
          onSelect={(id) => {
            if (playback.running) playback.stop();
            setSelectedId(id);
          }}
          error={editor.error}
          onContact={(contact) => editor.update((p) => ({ ...p, contact }))}
          onChange={(id, change) =>
            edit(() => {
              setSelectedId(id);
              editor.updateStep(id, change);
            })
          }
          onAction={(id, action) => edit(() => editor.action(id, action))}
          onAdd={(type) =>
            edit(() => {
              const step = createStep(type);
              editor.update((project) => ({ ...project, steps: [...project.steps, step] }));
              setSelectedId(step.id);
            })
          }
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
            onManual={() => void run(editor.project, false)}
            onAuto={() => void run(editor.project, true)}
            onStop={playback.stop}
            onReset={() => {
              setSelectedId(null);
              playback.reset();
            }}
          />
          <p className="play-status" role="status" aria-live="polite">
            {selectedStep ? 'Prévia da mensagem em edição' : playback.status}
          </p>
          {selectedStep ? (
            <>
              <div className="draft-preview-toolbar">
                <span>Editando etapa {editor.project.steps.indexOf(selectedStep) + 1}</span>
                <Button variant="ghost" onClick={() => setSelectedId(null)}>
                  Ver conversa
                </Button>
              </div>
              <MessagePreview
                key={`${selectedStep.id}:${selectedStep.type === 'business' ? (selectedStep.interactive?.kind ?? 'text') : selectedStep.type}`}
                contact={editor.project.contact}
                step={selectedStep}
                phoneRef={phoneRef}
              />
            </>
          ) : (
            <PhonePreview
              contact={editor.project.contact}
              playback={playback}
              phoneRef={phoneRef}
            />
          )}
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
