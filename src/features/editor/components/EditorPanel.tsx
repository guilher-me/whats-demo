import { useT } from '../../../i18n';
import type { Attachment, Contact, MessageStep, Project, Step } from '../../../core/types';
import { useRef, useState, useEffect } from 'react';
import { useAddedStepFocus } from '../hooks/useAddedStepFocus';
import { ContactEditor } from './ContactEditor';
import { StepCard } from './StepCard';
import { AddStepButtons } from './AddStepButtons';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/Field';
import type { StepAction } from './StepActions';
import type { SaveState } from '../hooks/useProject';
import { SortableSteps } from './SortableSteps';
import {
  conversationAttachments,
  MAX_ATTACHMENTS,
  nextImageName,
  selectAttachment,
  stepAttachment,
} from '../../../core/attachments';
import { AttachmentDialog } from './AttachmentDialog';
interface Props {
  saveState: SaveState;
  project: Project;
  revision: number;
  activeStep: string | null;
  selectedStep: string | null;
  disabled?: boolean;
  onSelect: (id: string | null) => void;
  error: string;
  onContact: (contact: Contact) => void;
  onChange: (id: string, change: Partial<Step>) => void;
  onReorder: (steps: Step[]) => void;
  onAction: (id: string, action: StepAction) => void;
  onAdd: (type: Step['type']) => string | undefined;
  onRestore: () => void;
  restoreLabel: string;
  onValidity: (id: string, valid: boolean) => void;
  onFlowPreview: (id: string, screenId?: string) => void;
  onAddAttachment: (item: Attachment, step: MessageStep, alternative: boolean) => void;
}
export function EditorPanel(props: Props) {
  const t = useT();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(props.project.steps[0]?.id ?? null);
  const [picker, setPicker] = useState<{
    stepId: string;
    revision: number;
    alternative: boolean;
  }>();
  const attachments = conversationAttachments(props.project);
  const target = props.project.steps.find((step) => step.id === picker?.stepId);
  const media = target?.type !== 'flow' ? target?.media : undefined;
  useEffect(() => {
    setExpandedId(props.project.steps[0]?.id ?? null);
  }, [props.revision]);
  const focusAdded = useAddedStepFocus(props.project.steps, scrollRef);
  return (
    <section
      className="editor"
      aria-label={t('editor.region')}
      inert={props.disabled || undefined}
      aria-disabled={props.disabled || undefined}
    >
      <div className="editor-scroll" ref={scrollRef}>
        <div className="section-heading">
          <div>
            <h2>{t('editor.title')}</h2>
            <p>{t('editor.orderHint')}</p>
          </div>
          <Button variant="ghost" onClick={props.onRestore}>
            {props.restoreLabel}
          </Button>
        </div>
        <ContactEditor
          key={props.revision}
          contact={props.project.contact}
          onChange={props.onContact}
        />
        <div className="timeline-heading">
          <div className="sequence-title">
            <h3>{t('editor.sequence')}</h3>
          </div>
          <span>{t('editor.stepCount', { count: props.project.steps.length })}</span>
        </div>
        <SortableSteps steps={props.project.steps} onChange={props.onReorder}>
          {(step, index, dragHandle) => (
            <StepCard
              key={`${props.revision}:${step.id}`}
              step={step}
              index={index}
              total={props.project.steps.length}
              active={props.activeStep === step.id}
              selected={props.selectedStep === step.id}
              dragHandle={dragHandle}
              expanded={(props.selectedStep ?? expandedId) === step.id}
              onToggle={() => {
                const next = (props.selectedStep ?? expandedId) === step.id ? null : step.id;
                setExpandedId(next);
                props.onSelect(next);
              }}
              onSelect={() => {
                setExpandedId(step.id);
                props.onSelect(step.id);
              }}
              onChange={(change) => props.onChange(step.id, change)}
              onAction={(action) => props.onAction(step.id, action)}
              onValidity={props.onValidity}
              onFlowPreview={(screenId) => props.onFlowPreview(step.id, screenId)}
              attachment={stepAttachment(step, attachments)}
              alternatives={attachments.filter(
                (item) => step.type !== 'flow' && step.media?.alternativeIds?.includes(item.id),
              )}
              onChooseAttachment={(alternative = false) =>
                setPicker({ stepId: step.id, revision: props.revision, alternative })
              }
            />
          )}
        </SortableSteps>
        <FieldError>{props.error}</FieldError>
      </div>
      <footer className="editor-footer">
        {props.saveState === 'failed' && (
          <p className="save-warning" role="alert">
            {t('storage.failureHelp')}
          </p>
        )}
        <AddStepButtons
          onAdd={(type) => {
            const id = props.onAdd(type);
            if (id) focusAdded(id);
          }}
          disabled={props.disabled || props.project.steps.length >= 200}
        />
      </footer>
      {picker?.revision === props.revision && target?.type !== 'flow' && target && media && (
        <AttachmentDialog
          key={target.id}
          kind={media.kind}
          atLimit={attachments.length >= MAX_ATTACHMENTS}
          imageName={nextImageName(attachments)}
          items={attachments.filter(
            (item) =>
              item.kind === media.kind &&
              item.id !== media.attachmentId &&
              (!picker.alternative || !media.alternativeIds?.includes(item.id)),
          )}
          onClose={() => setPicker(undefined)}
          onSelect={(item) => {
            props.onChange(target.id, {
              media: selectAttachment(media, item.id, picker.alternative),
            });
            setPicker(undefined);
          }}
          onCreate={(item) => props.onAddAttachment(item, target, picker.alternative)}
        />
      )}
    </section>
  );
}
