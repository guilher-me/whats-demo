import type { Step } from '../../../core/types';
import { TextField } from '../../../components/ui/Field';
import { Checkbox } from '../../../components/ui/Checkbox';
import { ControlIcon } from '../../../components/icons/ControlIcon';
export function StepTiming({
  step,
  onChange,
}: {
  step: Step;
  onChange: (change: Partial<Step>) => void;
}) {
  return (
    <div className="step-timing">
      <div className="timing-delay">
        <ControlIcon name="clock" />
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
      </div>
      {step.type !== 'user' && (
        <Checkbox
          label="Exibir “digitando”"
          checked={step.typing !== false}
          onChange={(e) => onChange({ typing: e.target.checked })}
        />
      )}
    </div>
  );
}
