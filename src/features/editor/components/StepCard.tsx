import { useT } from '../../../i18n';
import { useCallback, useId, useState, type ReactNode } from 'react';
import type { Attachment, Step } from '../../../core/types';
import { MessageTextEditor } from './MessageTextEditor';
import { StepTiming } from './StepTiming';
import { ControlIcon } from '../../../components/icons/ControlIcon';
import { StepActions, type StepAction } from './StepActions';
import { FlowStepEditor } from './FlowStepEditor';
import { BusinessMessageEditor } from './BusinessMessageEditor';
import { CustomerMessageEditor } from './CustomerMessageEditor';
import { businessMessageError } from '../../../core/interactive';
import { formatVoiceTime } from '../../../core/voice-message';
import { MicrophoneIcon } from '../../../components/icons/WhatsAppIcons';
export function StepCard({
  step,
  index,
  total,
  active,
  selected,
  expanded,
  onToggle,
  dragHandle,
  onSelect,
  onChange,
  onAction,
  onValidity,
  attachment,
  alternatives,
  onChooseAttachment,
}: {
  step: Step;
  index: number;
  total: number;
  active: boolean;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  dragHandle?: ReactNode;
  onSelect: () => void;
  onChange: (change: Partial<Step>) => void;
  onAction: (action: StepAction) => void;
  onValidity: (id: string, valid: boolean) => void;
  attachment?: Attachment;
  alternatives: Attachment[];
  onChooseAttachment: (alternative?: boolean) => void;
}) {
  const t = useT();
  const id = useId();
  const [flowInvalid, setFlowInvalid] = useState(false);
  const voiceSeconds = step.type === 'user' ? step.voiceDurationSeconds : undefined;
  const media = step.type === 'flow' ? undefined : step.media;
  const invalid = media
    ? !attachment
    : step.type === 'business'
      ? !!businessMessageError(step)
      : step.type === 'flow' && flowInvalid;

  const valid = useCallback(
    (value: boolean) => {
      setFlowInvalid(!value);
      onValidity(step.id, value);
    },
    [onValidity, step.id],
  );
  return (
    <article
      className={`step-card ${step.type === 'flow' ? 'flow-type' : ''} ${active ? 'active-step' : ''} ${selected ? 'selected-step' : ''} ${invalid ? 'is-invalid' : ''}`}
      tabIndex={0}
      aria-label={t('editor.stepLabel', { v0: index + 1 })}
      data-step-id={step.id}
      aria-current={selected ? 'step' : undefined}
      onFocusCapture={(event) => {
        if (!event.currentTarget.contains(event.target as Node)) return;
        if (
          !(event.target as HTMLElement).closest(
            '[data-step-toggle],[data-step-drag],[data-editor-action]',
          )
        )
          onSelect();
      }}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest('[data-step-drag],[data-editor-action]'))
          onSelect();
      }}
    >
      <div className="step-top">
        <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
        <button
          type="button"
          className="step-toggle"
          data-step-toggle
          aria-controls={id}
          aria-expanded={expanded}
          aria-label={t(expanded ? 'editor.collapseStep' : 'editor.expandStep', { v0: index + 1 })}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          <span className="step-type">
            {voiceSeconds === undefined ? (
              <ControlIcon
                name={step.type === 'flow' ? 'flow' : step.type === 'user' ? 'user' : 'message'}
              />
            ) : (
              <MicrophoneIcon width="20" height="20" />
            )}
            {step.type === 'flow'
              ? 'WhatsApp Flow'
              : step.type === 'user'
                ? t('editor.customerMessage')
                : t('editor.businessMessage')}
          </span>
          <span className="step-summary">
            {media
              ? (attachment?.name ??
                t(media.kind === 'image' ? 'attachments.image' : 'attachments.document'))
              : voiceSeconds === undefined
                ? step.text.replace(/[*_~]/g, '').replace(/\s+/g, ' ').slice(0, 110) ||
                  t('common.untitled')
                : `${t('editor.voiceMock')} · ${formatVoiceTime(voiceSeconds * 1000)}`}
          </span>
          <ControlIcon name="chevron" className="step-chevron" />
        </button>
        {invalid && <span className="step-invalid">{t('editor.needsAttention')}</span>}
        {dragHandle}
        <StepActions first={!index} last={index === total - 1} onAction={onAction} />
      </div>
      <div className="step-body" id={id} hidden={!expanded}>
        {step.type === 'business' ? (
          <BusinessMessageEditor
            step={step}
            onChange={onChange}
            attachment={attachment}
            onChooseAttachment={onChooseAttachment}
          />
        ) : step.type === 'user' ? (
          <CustomerMessageEditor
            step={step}
            onChange={onChange}
            attachment={attachment}
            alternatives={alternatives}
            onChooseAttachment={onChooseAttachment}
          />
        ) : (
          <MessageTextEditor
            label={t('editor.flowInvitation')}
            value={step.text}
            onChange={(text) => onChange({ text })}
          />
        )}
        {step.type === 'flow' && (
          <FlowStepEditor step={step} onChange={onChange} onValidity={valid} />
        )}
        <StepTiming step={step} onChange={onChange} />
      </div>
    </article>
  );
}
