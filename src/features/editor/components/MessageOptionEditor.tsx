import type { MessageOption } from '../../../core/types';
import { TextField } from '../../../components/ui/Field';
import { IconButton } from '../../../components/ui/IconButton';
export function MessageOptionEditor({
  option,
  index,
  description = false,
  removable,
  onChange,
  onRemove,
}: {
  option: MessageOption;
  index: number;
  description?: boolean;
  removable: boolean;
  onChange: (option: MessageOption) => void;
  onRemove: () => void;
}) {
  return (
    <div className="option-editor">
      <div className="option-editor-top">
        <span className="option-index">{index + 1}</span>
        <TextField
          label={description ? 'Título da opção' : 'Texto do botão'}
          value={option.title}
          maxLength={description ? 24 : 20}
          onChange={(e) => onChange({ ...option, title: e.target.value })}
        />
        <IconButton label={`Remover opção ${index + 1}`} disabled={!removable} onClick={onRemove}>
          ×
        </IconButton>
      </div>
      {description && (
        <TextField
          label="Descrição da opção (opcional)"
          value={option.description ?? ''}
          maxLength={72}
          onChange={(e) => onChange({ ...option, description: e.target.value })}
        />
      )}
    </div>
  );
}
