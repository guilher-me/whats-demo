import { catalogError, commercePreview, commerceStepError } from '../core/commerce';
import { currentLocale, useT } from '../i18n';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { AppHeader } from './AppHeader';
import { Workbench, type Panel } from './Workbench';
import { JourneyCode } from '../features/code/JourneyCode';
import { journeyDiagnostics } from '../features/flows/diagnostics';
import { useProject, type SharedCopy } from '../features/editor/hooks/useProject';
import { EditorPanel } from '../features/editor/components/EditorPanel';
import { ShareControls } from '../features/sharing/ShareControls';
import { usePlayback } from '../features/playback/hooks/usePlayback';
import { PlaybackControls } from '../features/playback/components/PlaybackControls';
import { PlaybackSpeedControl } from '../features/playback/components/PlaybackSpeedControl';
import { JourneyPhone } from '../features/conversation/components/JourneyPhone';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { businessMessageError } from '../core/interactive';
import { useAutomationAPI } from '../features/automation/useAutomationAPI';
import {
  MessagePreview,
  type FlowPreviewRequest,
} from '../features/conversation/components/MessagePreview';
import { createStep } from '../core/project';
import { flushSync } from 'react-dom';
import { useRecording } from '../features/recording/useRecording';
import { RecordingControls } from '../features/recording/components/RecordingControls';
import { TooltipIconButton } from '../components/ui/TooltipIconButton';
import { ControlIcon } from '../components/icons/ControlIcon';
import { ConversationOverview } from '../features/conversation/components/ConversationOverview';
import { stepAttachment } from '../core/attachments';
import { JourneyControls } from '../features/journeys/JourneyControls';
import { useLiveJourneyLink } from '../features/journeys/live-link';
export function EditorApp({
  copy,
  previewOnly,
  localId,
}: {
  copy?: SharedCopy;
  previewOnly?: boolean;
  localId?: string;
}) {
  const t = useT();
  const editor = useProject(copy, localId);
  return editor.ready ? (
    <EditorWorkspace editor={editor} previewOnly={previewOnly} />
  ) : (
    <p className="link-loading" role="status">
      {t('errors.loading')}
    </p>
  );
}

function EditorWorkspace({
  editor,
  previewOnly,
}: {
  editor: ReturnType<typeof useProject>;
  previewOnly?: boolean;
}) {
  const t = useT();
  const phoneRef = useRef<HTMLDivElement>(null);
  const playback = usePlayback(phoneRef);
  const focusContact = useRef(false);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({}),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [stepReveal, setStepReveal] = useState<{
      id: string;
      panel: 'code' | 'editor';
      explicit: boolean;
    }>(),
    [flowPreview, setFlowPreview] = useState<FlowPreviewRequest>(),
    [showOverview, setShowOverview] = useState(false),
    [restoreOpen, setRestoreOpen] = useState(false),
    [collapsed, setCollapsed] = useState<Partial<Record<Panel, boolean>>>(() =>
      previewOnly ? { code: true, editor: true } : {},
    );
  const diagnostics = useMemo(
    () => journeyDiagnostics(editor.project),
    [editor.project, currentLocale()],
  );
  const automaticIssue = diagnostics.find((issue) => issue.kind === 'automatic');
  const previewIssue = automaticIssue ?? diagnostics[0];
  const togglePanel = (panel: Panel) => {
    if (panel === 'preview' && !collapsed.preview && playback.running && !playback.paused)
      playback.pause();
    setCollapsed((panels) => ({ ...panels, [panel]: !panels[panel] }));
  };
  const selectStep = (id: string | null) => {
    setShowOverview(false);
    setSelectedId(id);
    if (!id) setStepReveal(undefined);
    setFlowPreview((current) => (current?.stepId === id ? current : undefined));
  };
  const navigateStep = (id: string, panel: 'code' | 'editor', explicit = false) => {
    selectStep(id);
    if (explicit) setCollapsed((panels) => ({ ...panels, [panel]: false }));
    setStepReveal(explicit || !collapsed[panel] ? { id, panel, explicit } : undefined);
  };
  useLayoutEffect(() => {
    if (stepReveal?.explicit && window.matchMedia?.('(max-width: 959px)').matches)
      document
        .getElementById('workspace-' + stepReveal.panel)
        ?.scrollIntoView?.({ block: 'start' });
  }, [stepReveal]);
  const onValidity = useCallback(
    (id: string, valid: boolean) =>
      setInvalid((current) => (current[id] === !valid ? current : { ...current, [id]: !valid })),
    [],
  );
  const hasErrors =
    !!catalogError(editor.project.catalog, false) ||
    editor.project.steps.some(
      (step, index) =>
        !!commerceStepError(editor.project, index) ||
        (step.type !== 'flow' && step.media
          ? !stepAttachment(step)
          : step.type === 'business'
            ? !!businessMessageError(step)
            : step.type === 'flow' && invalid[step.id]),
    );
  const { journey } = editor;
  useLiveJourneyLink(
    journey,
    editor.live && editor.items.some((item) => item.id === journey.id),
    hasErrors ||
      !!journey.code ||
      !!Object.keys(journey.flows ?? {}).length ||
      !!Object.keys(journey.answers ?? {}).length ||
      diagnostics.some((issue) => issue.kind === 'definition' && issue.severity === 'error'),
    currentLocale(),
  );
  useLayoutEffect(() => {
    if (!focusContact.current) return;
    focusContact.current = false;
    document.querySelector<HTMLInputElement>('[data-journey-contact]')?.focus();
  }, [editor.revision]);

  const selectedStep = !playback.running
    ? editor.project.steps.find((step) => step.id === selectedId)
    : undefined;
  const recorder = useRecording({
    phone: phoneRef,
    prepare: () =>
      flushSync(() => {
        selectStep(null);
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
  const replaceProject = (project: typeof editor.project) => {
    ensureAvailable();
    selectStep(null);
    playback.reset();
    editor.replace(project);
  };
  const run = (project: typeof editor.project, automatic: boolean) => {
    ensureAvailable();
    if (automatic && automaticIssue) throw new Error(automaticIssue.message);
    if (collapsed.preview) setCollapsed((panels) => ({ ...panels, preview: false }));
    selectStep(null);
    return playback.run(project, automatic);
  };
  useAutomationAPI({
    project: () => editor.project,
    state: () => ({
      ready: true,
      running: playback.running,
      status: playback.status,
      activeStep: playback.activeStep,
      flowScreen: playback.flow?.step.flow.screens[playback.flow.index]?.id ?? null,
      pendingMessageId:
        playback.interaction.pendingId ??
        (playback.running ? (playback.commerce.session?.messageId ?? null) : null),
      messages: playback.messages.map(({ attachment, ...message }) => {
        if (!attachment) return message;
        const entry = { ...message, attachmentId: attachment.id };
        if (attachment.kind !== 'location') return entry;
        const { name, address } = attachment;
        return { ...entry, location: { name, address } };
      }),
    }),
    hasErrors: () => hasErrors,
    replace: replaceProject,
    run,
    stop: () => {
      ensureAvailable();
      playback.stop();
    },
    reset: () => {
      ensureAvailable();
      selectStep(null);
      playback.reset();
    },
    instructions: () => document.getElementById('llms-txt')?.textContent ?? '',
    href: () => location.href,
  });
  useEffect(() => {
    playback.stop();
    setInvalid({});
    selectStep(null);
  }, [editor.revision, playback.stop]);
  const edit = (operation: () => void) => {
    if (recorder.busy) return;
    if (playback.running) playback.stop();
    operation();
  };
  const composerDisabled =
    hasErrors || !editor.project.steps.length || (!playback.running && recorder.busy);
  const sendFromComposer = () => {
    if (composerDisabled) return;
    selectStep(null);
    playback.sendOrStart(editor.project);
  };
  const editorPanel = (
    <EditorPanel
      title={journey.title}
      onTitle={editor.rename}
      flowDrafts={journey.flows}
      answersDrafts={journey.answers}
      onFlowDraft={editor.setFlowDraft}
      onAnswersDraft={editor.setAnswersDraft}
      saveState={editor.saveState}
      disabled={recorder.busy}
      project={editor.project}
      revision={editor.revision}
      activeStep={playback.activeStep}
      selectedStep={selectedStep?.id ?? null}
      revealStep={
        !collapsed.editor && stepReveal?.panel === 'editor' && stepReveal.id === selectedStep?.id
          ? stepReveal
          : undefined
      }
      onShowCode={(id) => navigateStep(id, 'code', true)}
      onSelect={(id) => {
        if (recorder.busy) return;
        if (playback.running) playback.stop();
        if (id) navigateStep(id, 'code');
        else selectStep(id);
      }}
      error={editor.error}
      onCatalog={(catalog) => edit(() => editor.update((project) => ({ ...project, catalog })))}
      onContact={(contact) => edit(() => editor.update((p) => ({ ...p, contact })))}
      onChange={(id, change) =>
        edit(() => {
          selectStep(id);
          editor.updateStep(id, change);
        })
      }
      onCartChange={(offerId, cartId, autoItems) =>
        edit(() => {
          const commerce = { kind: 'cart' as const, offerId, autoItems };
          if (cartId) {
            editor.updateStep(cartId, { commerce });
            return;
          }
          const cart = { ...createStep('user'), type: 'user' as const, text: '', commerce };
          editor.update((project) => {
            const position = project.steps.findIndex(({ id }) => id === offerId);
            if (position < 0 || project.steps.length >= 200) return project;
            return {
              ...project,
              steps: [
                ...project.steps.slice(0, position + 1),
                cart,
                ...project.steps.slice(position + 1),
              ],
            };
          });
        })
      }
      onAction={(id, action) => edit(() => editor.action(id, action))}
      onReorder={(steps) => edit(() => editor.update((project) => ({ ...project, steps })))}
      onAdd={(type) => {
        let addedId: string | undefined;
        edit(() => {
          const step = createStep(type);
          editor.update((project) => ({ ...project, steps: [...project.steps, step] }));
          selectStep(step.id);
          addedId = step.id;
        });
        return addedId;
      }}
      onRestore={journey.source ? () => setRestoreOpen(true) : undefined}
      onValidity={onValidity}
      onFlowPreview={(stepId, screenId) => {
        edit(() => {
          selectStep(stepId);
          setFlowPreview({ stepId, screenId });
          if (!screenId) {
            setCollapsed((panels) => ({ ...panels, preview: false }));
            if (window.matchMedia?.('(max-width: 959px)').matches)
              window.requestAnimationFrame(() =>
                phoneRef.current?.scrollIntoView?.({ block: 'nearest' }),
              );
          }
        });
      }}
    />
  );
  const preview = (
    <section className="preview" aria-label={t('app.preview')}>
      <div className="preview-heading">
        <div>
          <h2>{t('app.preview')}</h2>
          <p>{t('app.previewHint')}</p>
          {previewIssue && (
            <p
              className="workspace-flow-issue"
              data-severity={previewIssue.severity}
              title={previewIssue.path}
            >
              {previewIssue.message}
            </p>
          )}
        </div>
        {flowPreview?.stepId === selectedStep?.id && flowPreview && (
          <Button
            variant="ghost"
            disabled={recorder.busy}
            onClick={() => setFlowPreview({ ...flowPreview })}
          >
            {t('builder.restart')}
          </Button>
        )}
      </div>
      <p className="play-status" role="status" aria-live="polite">
        {showOverview
          ? t('app.viewConversation')
          : selectedStep
            ? t('app.draft')
            : editor.project.steps.length
              ? playback.status
              : t('playback.addStep')}
      </p>
      <div
        className="phone-stage"
        style={{ '--cursor-speed': playback.cursorSpeed } as CSSProperties}
      >
        {showOverview ? (
          <ConversationOverview project={editor.project} phoneRef={phoneRef} />
        ) : selectedStep ? (
          <>
            <MessagePreview
              key={`${selectedStep.id}:${selectedStep.type === 'flow' ? 'flow' : (selectedStep.commerce?.kind ?? selectedStep.media?.kind ?? selectedStep.interactive?.kind ?? selectedStep.type)}`}
              contact={editor.project.contact}
              step={selectedStep}
              phoneRef={phoneRef}
              flowPreview={flowPreview?.stepId === selectedStep.id ? flowPreview : undefined}
              attachment={stepAttachment(selectedStep)}
              commerce={commercePreview(editor.project, editor.project.steps.indexOf(selectedStep))}
            />
          </>
        ) : (
          <JourneyPhone
            project={editor.project}
            playback={playback}
            phoneRef={phoneRef}
            disabled={composerDisabled}
            onSend={sendFromComposer}
            onStart={() => void run(editor.project, false)}
          />
        )}
        <div className="phone-tools">
          <PlaybackControls
            showFirstVisitHint={
              previewOnly && collapsed.code && collapsed.editor && !collapsed.preview
            }
            locked={recorder.busy}
            autoDisabled={!!automaticIssue}
            disabled={hasErrors || !editor.project.steps.length}
            running={playback.running}
            paused={playback.paused}
            onManual={() => void run(editor.project, false)}
            onAuto={() => void run(editor.project, true)}
            onPause={playback.pause}
            onResume={playback.resume}
            onReset={() => {
              selectStep(null);
              playback.reset();
            }}
          />
          <PlaybackSpeedControl
            speed={playback.speed}
            onChange={playback.setSpeed}
            disabled={recorder.busy || playback.paused}
          />
          <RecordingControls
            controller={recorder}
            autoDisabled={!!automaticIssue}
            disabled={hasErrors || !editor.project.steps.length}
          />
          {(selectedStep || showOverview) && (
            <div className="preview-navigation">
              <TooltipIconButton
                label={t('app.viewConversation')}
                description={t('app.viewConversationHint')}
                aria-controls="phone-preview"
                disabled={recorder.busy}
                aria-pressed={showOverview}
                onClick={() => {
                  setSelectedId(null);
                  setFlowPreview(undefined);
                  setShowOverview(true);
                }}
              >
                <ControlIcon name="message" />
              </TooltipIconButton>
            </div>
          )}
        </div>
      </div>
      <p className="preview-note">{t('app.local')}</p>
    </section>
  );
  return (
    <div className={recorder.busy ? 'editor-app is-capturing' : 'editor-app'}>
      <AppHeader disabled={recorder.busy} saveState={editor.saveState}>
        <ShareControls project={editor.project} disabled={recorder.busy} hasErrors={hasErrors} />
      </AppHeader>
      <Workbench
        collapsed={collapsed}
        onToggle={togglePanel}
        locked={recorder.busy}
        journeyControls={
          <>
            <JourneyControls
              active={journey}
              items={editor.items}
              disabled={recorder.busy}
              onCreate={() => {
                playback.reset();
                focusContact.current = true;
                setCollapsed((panels) => ({ ...panels, editor: false, preview: false }));
                editor.create();
              }}
              onOpen={(item) => {
                playback.reset();
                setCollapsed((panels) => ({ ...panels, editor: false, preview: false }));
                editor.select(item);
              }}
              onRename={editor.renameItem}
              onDelete={async (item) => {
                if (await editor.remove(item)) {
                  playback.reset();
                  setCollapsed((panels) => ({ ...panels, editor: false, preview: false }));
                }
              }}
            />
            {collapsed.editor && editor.saveState === 'failed' && (
              <p className="save-warning" role="alert">
                {t('storage.failureHelp')}
              </p>
            )}
          </>
        }
        contents={{
          code: (
            <JourneyCode
              key={journey.id}
              draft={journey.code}
              onDraftChange={editor.setCodeDraft}
              project={editor.project}
              diagnostics={diagnostics}
              disabled={recorder.busy}
              selectedStep={selectedStep?.id}
              revealStep={
                !collapsed.code &&
                stepReveal?.panel === 'code' &&
                stepReveal.id === selectedStep?.id
                  ? stepReveal
                  : undefined
              }
              onSelectStep={
                recorder.busy || playback.running ? undefined : (id) => navigateStep(id, 'editor')
              }
              onShowStep={
                recorder.busy || playback.running
                  ? undefined
                  : (id) => navigateStep(id, 'editor', true)
              }
              onApply={replaceProject}
            />
          ),
          editor: editorPanel,
          preview,
        }}
      />
      {journey.source && (
        <Dialog
          open={restoreOpen}
          onOpenChange={setRestoreOpen}
          title={t('sharing.restoreCopy')}
          description={t('sharing.restoreCopyHint')}
        >
          <div className="dialog-actions">
            <Button onClick={() => setRestoreOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              onClick={() => {
                edit(() => {
                  playback.reset();
                  void editor.restore();
                });
                setRestoreOpen(false);
              }}
            >
              {t('sharing.restoreSource')}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
