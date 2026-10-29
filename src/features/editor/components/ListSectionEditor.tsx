import type { ListSection } from '../../../core/types';
import { uid } from '../../../core/project';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/IconButton';
import { TextField } from '../../../components/ui/Field';
import { MessageOptionEditor } from './MessageOptionEditor';
export function ListSectionEditor({
  section,
  index,
  canAdd,
  removable,
  onChange,
  onRemove,
}: {
  section: ListSection;
  index: number;
  canAdd: boolean;
  removable: boolean;
  onChange: (section: ListSection) => void;
  onRemove: () => void;
}) {
  return (
    <fieldset className="list-section-editor">
      <legend>Seção {index + 1}</legend>
      <div className="option-editor-top">
        <TextField
          label="Título da seção"
          value={section.title}
          maxLength={24}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
        />
        <IconButton label={`Remover seção ${index + 1}`} disabled={!removable} onClick={onRemove}>
          ×
        </IconButton>
      </div>
      {section.rows.map((option, i) => (
        <MessageOptionEditor
          key={option.id}
          description
          option={option}
          index={i}
          removable={section.rows.length > 1}
          onChange={(next) =>
            onChange({ ...section, rows: section.rows.map((r, n) => (n === i ? next : r)) })
          }
          onRemove={() => onChange({ ...section, rows: section.rows.filter((_, n) => n !== i) })}
        />
      ))}
      <Button
        variant="ghost"
        disabled={!canAdd}
        onClick={() =>
          onChange({
            ...section,
            rows: [...section.rows, { id: uid(), title: `Opção ${section.rows.length + 1}` }],
          })
        }
      >
        ＋ Adicionar opção
      </Button>
    </fieldset>
  );
}
