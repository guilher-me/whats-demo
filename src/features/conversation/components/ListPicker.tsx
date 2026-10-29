import type { ListMessage } from '../../../core/types';
import { PhoneSheet } from '../../../components/ui/PhoneSheet';
import { Button } from '../../../components/ui/Button';
export function ListPicker({
  message,
  selected,
  container,
  onSelect,
  onConfirm,
  onClose,
}: {
  message: ListMessage;
  selected: string;
  container: HTMLElement | null;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <PhoneSheet
      container={container}
      title={message.button}
      description="Escolha uma opção e envie sua resposta."
      onClose={onClose}
    >
      <div className="list-picker-content">
        {message.sections.map((section, i) => (
          <fieldset key={i} className="list-picker-section">
            {section.title && <legend>{section.title}</legend>}
            {section.rows.map((row) => (
              <label key={row.id} className="list-picker-row">
                <span>
                  <span className="list-row-title">{row.title}</span>
                  {row.description && <small>{row.description}</small>}
                </span>
                <input
                  type="radio"
                  name="list-reply"
                  value={row.id}
                  data-list-option={row.id}
                  checked={selected === row.id}
                  onChange={() => onSelect(row.id)}
                />
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <footer>
        <Button variant="primary" data-confirm-list disabled={!selected} onClick={onConfirm}>
          Enviar
        </Button>
      </footer>
    </PhoneSheet>
  );
}
