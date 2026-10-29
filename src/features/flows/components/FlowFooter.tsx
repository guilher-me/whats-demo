import { Button } from '../../../components/ui/Button';
import { useId } from 'react';
export function FlowFooter({
  label,
  disabled,
  error,
  onNext,
}: {
  label: string;
  disabled: boolean;
  error?: string;
  onNext: () => void;
}) {
  const errorId = useId();
  return (
    <footer>
      {error && (
        <p className="flow-error" role="alert" id={errorId}>
          {error}
        </p>
      )}
      <Button
        variant="primary"
        data-flow-next
        disabled={disabled}
        onClick={onNext}
        aria-describedby={error ? errorId : undefined}
      >
        {label}
      </Button>
      <small>
        Gerenciada pela empresa. <span>Saiba mais</span>
      </small>
    </footer>
  );
}
