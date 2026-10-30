import { useT } from '../i18n';
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
import { flushSync } from 'react-dom';
import { useRecording } from '../features/recording/useRecording';
import { RecordingControls } from '../features/recording/components/RecordingControls';
import { TooltipIconButton } from '../components/ui/TooltipIconButton';
import { ControlIcon } from '../components/icons/ControlIcon';
export function App() {
  const t = useT();

  const editor = useProject(),
    phoneRef = useRef<HTMLDivElement>(null),
    playback = usePlayback(phoneRef);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({}),
    [focusMode, setFocusMode] = useState(false),
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
  const recorder = useRecording({
    phone: phoneRef,
    prepare: () =>
      flushSync(() => {
        setSelectedId(null);
        setFocusMode(false);
        playback.reset();
      }),
    run: (automatic) => playback.run(editor.project, automatic),
    stopPlayback: () => {
      if (playback.running) playback.stop();
    },
    playbackStatus: () => playback.status,
  });
  const ensureAvailable = () => {
    if (recorder.busy) throw new Error(t('app.recordingLocked'));
  };
  const run = (project: typeof editor.project, automatic: boolean) => {
    ensureAvailable();
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
      ensureAvailable();
      setSelectedId(null);
      playback.reset();
      editor.replace(project);
    },
    run,
    stop: () => {
      ensureAvailable();
      playback.stop();
    },
    reset: () => {
      ensureAvailable();
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
      if (event.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const edit = (operation: () => void) => {
    if (recorder.busy) return;
    if (playback.running) playback.stop();
    operation();
  };
  return (
    <div
      className={
        [focusMode ? 'focus-mode' : '', recorder.busy ? 'is-capturing' : '']
          .filter(Boolean)
          .join(' ') || undefined
      }
    >
      <AppHeader disabled={recorder.busy}>
        <ShareButton
          project={editor.project}
          disabled={hasErrors || editor.loading || recorder.busy}
          onError={editor.setError}
        />
      </AppHeader>
      <main className="workspace">
        <EditorPanel
          saveState={editor.saveState}
          disabled={recorder.busy}
          project={editor.project}
          revision={editor.revision}
          activeStep={playback.activeStep}
          selectedStep={selectedStep?.id ?? null}
          onSelect={(id) => {
            if (recorder.busy) return;
            if (playback.running) playback.stop();
            setSelectedId(id);
          }}
          error={editor.error}
          onContact={(contact) => edit(() => editor.update((p) => ({ ...p, contact })))}
          onChange={(id, change) =>
            edit(() => {
              setSelectedId(id);
              editor.updateStep(id, change);
            })
          }
          onAction={(id, action) => edit(() => editor.action(id, action))}
          onAdd={(type) => {
            let addedId: string | undefined;
            edit(() => {
              const step = createStep(type);
              editor.update((project) => ({ ...project, steps: [...project.steps, step] }));
              setSelectedId(step.id);
              addedId = step.id;
            });
            return addedId;
          }}
          onRestore={() => setRestoreOpen(true)}
          onError={editor.setError}
          onValidity={onValidity}
        />
        <section className="preview" aria-label={t('app.preview')}>
          <div className="preview-heading">
            <div>
              <h2>{t('app.preview')}</h2>
              <p>{t('app.previewHint')}</p>
            </div>
            <Button
              variant="ghost"
              disabled={
                recorder.busy || hasErrors || editor.loading || !editor.project.steps.length
              }
              title={playback.running ? t('app.expand') : t('app.startPhone')}
              onClick={() => {
                if (!playback.running) void run(editor.project, false);
                setFocusMode(true);
              }}
            >
              {t('app.phoneOnly')}
            </Button>
          </div>
          <p className="play-status" role="status" aria-live="polite">
            {selectedStep ? t('app.draft') : playback.status}
          </p>
          <div className="phone-stage">
            {selectedStep ? (
              <>
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
            <div className="phone-tools">
              <PlaybackControls
                locked={recorder.busy}
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
              <RecordingControls
                controller={recorder}
                disabled={hasErrors || editor.loading || !editor.project.steps.length}
              />
              {selectedStep && (
                <div className="preview-navigation">
                  <TooltipIconButton
                    label={t('app.viewConversation')}
                    description={t('app.draft')}
                    aria-controls="phone-preview"
                    onClick={() => setSelectedId(null)}
                  >
                    <ControlIcon name="message" />
                  </TooltipIconButton>
                </div>
              )}
            </div>
          </div>
          <p className="preview-note">{t('app.local')}</p>
          {focusMode && (
            <Button variant="ghost" onClick={() => setFocusMode(false)}>
              {t('app.exit')}
            </Button>
          )}
        </section>
      </main>
      <Dialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title={t('app.restoreTitle')}
        description={t('app.restoreHint')}
      >
        <div className="dialog-actions">
          <Button onClick={() => setRestoreOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            onClick={() => {
              edit(editor.restore);
              setRestoreOpen(false);
            }}
          >
            {t('editor.restore')}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
