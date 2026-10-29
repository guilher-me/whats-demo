import type { ListMessage } from '../../../core/types';
import { uid } from '../../../core/project';
import { messageOptions } from '../../../core/interactive';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/Field';
import { ListSectionEditor } from './ListSectionEditor';
export function ListMessageEditor({
  value,
  onChange,
}: {
  value: ListMessage;
  onChange: (value: ListMessage) => void;
}) {
  const count = messageOptions(value).length;
  return (
    <div className="options-editor">
      <TextField
        label="Texto do botão da lista"
        value={value.button}
        maxLength={20}
        onChange={(e) => onChange({ ...value, button: e.target.value })}
      />
      <div className="control-caption">
        <span>Seções e opções</span>
        <small>{count}/10 opções</small>
      </div>
      {value.sections.map((section, i) => (
        <ListSectionEditor
          key={i}
          section={section}
          index={i}
          canAdd={count < 10}
          removable={value.sections.length > 1}
          onChange={(next) =>
            onChange({ ...value, sections: value.sections.map((s, n) => (n === i ? next : s)) })
          }
          onRemove={() =>
            onChange({ ...value, sections: value.sections.filter((_, n) => n !== i) })
          }
        />
      ))}
      <Button
        variant="ghost"
        disabled={count >= 10 || value.sections.length >= 10}
        onClick={() =>
          onChange({
            ...value,
            sections: [
              ...value.sections,
              {
                title: `Seção ${value.sections.length + 1}`,
                rows: [{ id: uid(), title: 'Nova opção' }],
              },
            ],
          })
        }
      >
        ＋ Adicionar seção
      </Button>
    </div>
  );
}
