import type { Step } from '../../../core/types';
import { Button } from '../../../components/ui/Button';
export function AddStepButtons({
  onAdd,
  disabled,
}: {
  onAdd: (type: Step['type']) => void;
  disabled?: boolean;
}) {
  return (
    <div className="add-row">
      <Button disabled={disabled} onClick={() => onAdd('user')}>
        ＋ Cliente
      </Button>
      <Button disabled={disabled} onClick={() => onAdd('business')}>
        ＋ Empresa
      </Button>
      <Button disabled={disabled} onClick={() => onAdd('flow')}>
        ＋ Flow
      </Button>
    </div>
  );
}
