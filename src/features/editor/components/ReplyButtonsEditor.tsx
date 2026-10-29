import type { ReplyButtonsMessage } from '../../../core/types';
import { uid } from '../../../core/project';
import { Button } from '../../../components/ui/Button';
import { MessageOptionEditor } from './MessageOptionEditor';
export function ReplyButtonsEditor({
  value,
  onChange,
}: {
  value: ReplyButtonsMessage;
  onChange: (value: ReplyButtonsMessage) => void;
}) {
  return (
    <div className="options-editor">
      <div className="control-caption">
        <span>Botões de resposta</span>
        <small>{value.buttons.length}/3</small>
      </div>
      {value.buttons.map((option, i) => (
        <MessageOptionEditor
          key={option.id}
          option={option}
          index={i}
          removable={value.buttons.length > 1}
          onChange={(next) =>
            onChange({ ...value, buttons: value.buttons.map((o, n) => (n === i ? next : o)) })
          }
          onRemove={() => onChange({ ...value, buttons: value.buttons.filter((_, n) => n !== i) })}
        />
      ))}
      <Button
        variant="ghost"
        disabled={value.buttons.length >= 3}
        onClick={() =>
          onChange({
            ...value,
            buttons: [...value.buttons, { id: uid(), title: `Opção ${value.buttons.length + 1}` }],
          })
        }
      >
        ＋ Adicionar botão
      </Button>
    </div>
  );
}
