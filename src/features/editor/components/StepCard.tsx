import { useCallback } from 'react';
import type { Step } from '../../../core/types';
import { TextArea } from '../../../components/ui/Field';
import { StepTiming } from './StepTiming';
import { ControlIcon } from '../../../components/icons/ControlIcon';
import { StepActions, type StepAction } from './StepActions';
import { FlowStepEditor } from './FlowStepEditor';
import { BusinessMessageEditor } from './BusinessMessageEditor';
export function StepCard({
  step,
  index,
  total,
  active,
  selected,
  onSelect,
  onChange,
  onAction,
  onValidity,
}: {
  step: Step;
  index: number;
  total: number;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (change: Partial<Step>) => void;
  onAction: (action: StepAction) => void;
  onValidity: (id: string, valid: boolean) => void;
}) {
  const valid = useCallback((value: boolean) => onValidity(step.id, value), [onValidity, step.id]);
  return (
    <article
      className={`step-card ${step.type === 'flow' ? 'flow-type' : ''} ${active ? 'active-step' : ''} ${selected ? 'selected-step' : ''}`}
      tabIndex={0}
      aria-label={`Etapa ${index + 1}`}
      data-step-id={step.id}
      aria-current={selected ? 'step' : undefined}
      onFocusCapture={onSelect}
      onClick={onSelect}
    >
      <div className="step-top">
        <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="step-type">
          <ControlIcon
            name={step.type === 'flow' ? 'flow' : step.type === 'user' ? 'user' : 'message'}
          />
          {step.type === 'flow'
            ? 'WhatsApp Flow'
            : step.type === 'user'
              ? 'Mensagem do cliente'
              : 'Mensagem da empresa'}
        </span>
        <StepActions first={!index} last={index === total - 1} onAction={onAction} />
      </div>
      <div className="step-body">
        {step.type === 'business' ? (
          <BusinessMessageEditor step={step} onChange={onChange} />
        ) : (
          <TextArea
            label={step.type === 'flow' ? 'Mensagem com o convite ao Flow' : 'Texto da mensagem'}
            value={step.text}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        )}
        <StepTiming step={step} onChange={onChange} />
        {step.type === 'flow' && (
          <FlowStepEditor step={step} onChange={onChange} onValidity={valid} />
        )}
      </div>
    </article>
  );
}
