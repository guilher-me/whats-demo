import { Button } from '../../../components/ui/Button';
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
  return (
    <footer>
      {error && (
        <p className="flow-error" role="alert">
          {error}
        </p>
      )}
      <Button variant="primary" data-flow-next disabled={disabled} onClick={onNext}>
        {label}
      </Button>
      <small>
        Gerenciada pela empresa. <span>Saiba mais</span>
      </small>
    </footer>
  );
}
