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
import { availableAttachments, MAX_ATTACHMENTS, stepAttachment } from '../../../core/attachments';
import { AttachmentLibrary } from './AttachmentLibrary';
import { AttachmentDialog } from './AttachmentDialog';
import { AttachmentDetails } from '../../conversation/components/AttachmentVisual';
import { Dialog } from '../../../components/ui/Dialog';
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
  onError: (error: string) => void;
  onValidity: (id: string, valid: boolean) => void;
  onAddAttachment: (item: Attachment, step?: MessageStep) => void;
  onRemoveAttachment: (id: string) => void;
  onAttachmentVisibility: (id: string, visible: boolean) => void;
}
export function EditorPanel(props: Props) {
  const t = useT();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(props.project.steps[0]?.id ?? null);
  const [picker, setPicker] = useState<{ stepId?: string; revision: number }>();
  const [preview, setPreview] = useState<{ item: Attachment; revision: number }>();
  const attachments = props.project.attachments ?? [];
  const target = props.project.steps.find((step) => step.id === picker?.stepId);
  const mediaTarget = target?.type !== 'flow' && target?.media ? target : undefined;
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
            {t('editor.restore')}
          </Button>
        </div>
        <ContactEditor
          key={props.revision}
          contact={props.project.contact}
          onChange={props.onContact}
          onError={props.onError}
        />
        <AttachmentLibrary
          key={`attachments:${props.revision}`}
          items={attachments}
          steps={props.project.steps}
          onAdd={() => setPicker({ revision: props.revision })}
          onPreview={(item) => setPreview({ item, revision: props.revision })}
          onRemove={props.onRemoveAttachment}
          onVisibility={props.onAttachmentVisibility}
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
              attachment={stepAttachment(step, attachments)}
              onChooseAttachment={() => setPicker({ stepId: step.id, revision: props.revision })}
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
      {picker?.revision === props.revision && (!picker.stepId || mediaTarget) && (
        <AttachmentDialog
          kind={mediaTarget?.media?.kind}
          customer={mediaTarget?.type !== 'business'}
          atLimit={attachments.length >= MAX_ATTACHMENTS}
          items={
            mediaTarget?.media
              ? availableAttachments(
                  attachments,
                  mediaTarget.media.kind,
                  mediaTarget.type === 'user',
                )
              : []
          }
          onClose={() => setPicker(undefined)}
          onSelect={
            mediaTarget?.media
              ? (item) => {
                  props.onChange(mediaTarget.id, {
                    media: { ...mediaTarget.media, kind: item.kind, attachmentId: item.id },
                  });
                  setPicker(undefined);
                }
              : undefined
          }
          onCreate={(item) => props.onAddAttachment(item, mediaTarget)}
        />
      )}
      {preview?.revision === props.revision && (
        <Dialog open title={preview.item.name} onOpenChange={() => setPreview(undefined)}>
          <AttachmentDetails item={preview.item} />
        </Dialog>
      )}
    </section>
  );
}
