import { useT } from '../../../i18n';
import type { FlowStep } from '../../../core/types';
export function FlowInvitation({
  step,
  completed,
  disabled,
  onOpen,
}: {
  step: FlowStep;
  completed: boolean;
  disabled: boolean;
  onOpen: (step: FlowStep) => void;
}) {
  const t = useT();

  return (
    <button
      type="button"
      className="open-flow"
      data-open-step={step.id}
      disabled={completed || disabled}
      onClick={() => onOpen(step)}
    >
      {completed ? t('phone.done') : step.label || t('seed.openFlow')}
    </button>
  );
}
