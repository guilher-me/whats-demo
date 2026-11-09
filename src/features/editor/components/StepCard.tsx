import { variableText } from '../../../core/journey-variables';
import { FieldError } from '../../../components/ui/Field';
import type { JourneyDiagnostic } from '../../flows/diagnostics';
import { Button } from '../../../components/ui/Button';
import { useT } from '../../../i18n';
import { stepAttachment } from '../../../core/attachments';
import { useCallback, useId, useState, type ReactNode } from 'react';
import type { CartItem, Project, Step } from '../../../core/types';
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
import type { AnswersDraft, FlowDraft } from '../../journeys/storage';
export function StepCard({
  flowDraft,
  answersDraft,
  onFlowDraft,
  onAnswersDraft,
  step,
  project,
  commerceError,
  diagnostics,
  index,
  total,
  active,
  selected,
  expanded,
  onToggle,
  dragHandle,
  onSelect,
  onShowCode,
  onChange,
  onCartChange,
  onAction,
  onValidity,
  onFlowPreview,
}: {
  step: Step;
  flowDraft?: FlowDraft;
  answersDraft?: AnswersDraft;
  onFlowDraft: (draft?: FlowDraft) => void;
  onAnswersDraft: (draft?: AnswersDraft) => void;
  project: Project;
  commerceError: string;
  diagnostics: JourneyDiagnostic[];
  index: number;
  total: number;
  active: boolean;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  dragHandle?: ReactNode;
  onSelect: () => void;
  onShowCode: () => void;
  onChange: (change: Partial<Step>) => void;
  onCartChange: (cartId?: string, items?: CartItem[]) => void;
  onAction: (action: StepAction) => void;
  onValidity: (id: string, valid: boolean) => void;
  onFlowPreview: (screenId?: string) => void;
}) {
  const t = useT();
  const id = useId();
  const [flowInvalid, setFlowInvalid] = useState(false);
  const voiceSeconds = step.type === 'user' ? step.voiceDurationSeconds : undefined;
  const media = step.type === 'flow' ? undefined : step.media;
  const attachment = stepAttachment(step);
  const target = variableText(step);
  const variableScope = expanded && target ? { project, index } : undefined;
  const issues = target
    ? diagnostics.filter((issue) => issue.path === 'steps[' + index + '].' + target.field)
    : [];
  const invalid =
    commerceError ||
    issues.some((issue) => issue.severity === 'error') ||
    (media
      ? !attachment
      : step.type === 'business'
        ? !!businessMessageError(step)
        : step.type === 'flow' && flowInvalid);

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
        <code className="step-id" title={step.id}>
          {step.id}
        </code>
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
            {step.type !== 'flow' && step.commerce
              ? t(`commerce.${step.commerce.kind}`)
              : media
                ? (attachment?.name ?? t(`attachments.${media.kind}`))
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
        {expanded && (
          <Button
            variant="ghost"
            className="step-code-link"
            data-editor-action
            onClick={onShowCode}
          >
            {t('code.showInCode')}
          </Button>
        )}
        {step.type === 'business' ? (
          <BusinessMessageEditor
            step={step}
            variableScope={variableScope}
            project={project}
            index={index}
            commerceError={commerceError}
            onChange={onChange}
            onCartChange={onCartChange}
          />
        ) : step.type === 'user' ? (
          <CustomerMessageEditor
            step={step}
            project={project}
            index={index}
            commerceError={commerceError}
            onChange={onChange}
          />
        ) : (
          <MessageTextEditor
            label={t('editor.flowInvitation')}
            variableScope={variableScope}
            value={step.text}
            onChange={(text) => onChange({ text })}
          />
        )}
        {issues.map((issue, index) =>
          issue.severity === 'error' ? (
            <FieldError key={index}>{issue.message}</FieldError>
          ) : (
            <p key={index} className="formatting-hint">
              {issue.message}
            </p>
          ),
        )}
        {step.type === 'flow' && (
          <FlowStepEditor
            draft={flowDraft}
            answersDraft={answersDraft}
            onDraft={onFlowDraft}
            onAnswersDraft={onAnswersDraft}
            step={step}
            expanded={expanded}
            onChange={onChange}
            onValidity={valid}
            onPreview={onFlowPreview}
          />
        )}
        <StepTiming step={step} onChange={onChange} />
      </div>
    </article>
  );
}
