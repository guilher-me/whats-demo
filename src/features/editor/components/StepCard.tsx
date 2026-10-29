import { useCallback } from 'react';
import type { Step } from '../../../core/types';
import { TextArea, TextField } from '../../../components/ui/Field';
import { Checkbox } from '../../../components/ui/Checkbox';
import { StepActions, type StepAction } from './StepActions';
import { FlowStepEditor } from './FlowStepEditor';
export function StepCard({
  step,
  index,
  total,
  active,
  onChange,
  onAction,
  onValidity,
}: {
  step: Step;
  index: number;
  total: number;
  active: boolean;
  onChange: (change: Partial<Step>) => void;
  onAction: (action: StepAction) => void;
  onValidity: (id: string, valid: boolean) => void;
}) {
  const valid = useCallback((value: boolean) => onValidity(step.id, value), [onValidity, step.id]);
  return (
    <article
      className={`step-card ${step.type === 'flow' ? 'flow-type' : ''} ${active ? 'active-step' : ''}`}
    >
      <div className="step-top">
        <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="step-type">
          <i className="type-dot" />
          {step.type === 'flow'
            ? 'WhatsApp Flow'
            : step.type === 'user'
              ? 'Mensagem do cliente'
              : 'Mensagem da empresa'}
        </span>
        <StepActions first={!index} last={index === total - 1} onAction={onAction} />
      </div>
      <div className="step-body">
        <TextArea
          label={step.type === 'flow' ? 'Mensagem com o convite ao Flow' : 'Texto da mensagem'}
          value={step.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
        <div className="step-bottom">
          <TextField
            label={
              step.type === 'user' ? 'Pausa antes de digitar (s)' : 'Delay antes da resposta (s)'
            }
            type="number"
            min={0}
            max={120}
            step={0.1}
            value={step.delay}
            onChange={(e) =>
              onChange({ delay: Math.min(120, Math.max(0, Number(e.target.value) || 0)) })
            }
          />
          {step.type !== 'user' && (
            <Checkbox
              label="Exibir “digitando”"
              checked={step.typing !== false}
              onChange={(e) => onChange({ typing: e.target.checked })}
            />
          )}
        </div>
        {step.type === 'flow' && (
          <FlowStepEditor step={step} onChange={onChange} onValidity={valid} />
        )}
      </div>
    </article>
  );
}
