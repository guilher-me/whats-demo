import type { Step } from '../../../core/types';
import { Button } from '../../../components/ui/Button';
import { ControlIcon } from '../../../components/icons/ControlIcon';
const entries = [
  { type: 'user', name: 'Cliente', detail: 'Mensagem recebida', icon: 'user' },
  { type: 'business', name: 'Empresa', detail: 'Texto, botões ou lista', icon: 'message' },
  { type: 'flow', name: 'Flow', detail: 'Formulário interativo', icon: 'flow' },
] as const;
export function AddStepButtons({
  onAdd,
  disabled,
}: {
  onAdd: (type: Step['type']) => void;
  disabled?: boolean;
}) {
  return (
    <div className="component-palette">
      <div className="control-caption">
        <span>ADICIONAR À CONVERSA</span>
        <small>Escolha um componente</small>
      </div>
      <div className="add-row" role="group" aria-label="Adicionar etapas à conversa">
        {entries.map((entry) => (
          <Button
            key={entry.type}
            aria-label={`＋ ${entry.name}`}
            disabled={disabled}
            onClick={() => onAdd(entry.type)}
          >
            <span className="palette-icon">
              <ControlIcon name={entry.icon} />
            </span>
            <span>
              <span>{entry.name}</span>
              <small>{entry.detail}</small>
            </span>
            <span className="palette-plus" aria-hidden="true">
              ＋
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
