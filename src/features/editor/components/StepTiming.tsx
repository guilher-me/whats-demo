import { useT } from '../../../i18n';
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
  const t = useT();

  return (
    <div className="step-timing">
      <div className="timing-delay">
        <ControlIcon name="clock" />
        <TextField
          label={step.type === 'user' ? t('editor.typingDelay') : t('editor.replyDelay')}
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
          label={t('editor.showTyping')}
          checked={step.typing !== false}
          onChange={(e) => onChange({ typing: e.target.checked })}
        />
      )}
    </div>
  );
}
