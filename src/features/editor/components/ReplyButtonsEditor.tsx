import type { ReplyButtonsMessage } from '../../../core/types';
import { uid } from '../../../core/project';
import { Button } from '../../../components/ui/Button';
import { MessageOptionEditor } from './MessageOptionEditor';
import { SortableOptions } from './SortableOptions';
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
      <SortableOptions
        options={value.buttons}
        onChange={(buttons) => onChange({ ...value, buttons })}
      >
        {(option, i, dragHandle) => (
          <MessageOptionEditor
            key={option.id}
            option={option}
            index={i}
            dragHandle={dragHandle}
            removable={value.buttons.length > 1}
            onChange={(next) =>
              onChange({ ...value, buttons: value.buttons.map((o, n) => (n === i ? next : o)) })
            }
            onRemove={() =>
              onChange({ ...value, buttons: value.buttons.filter((_, n) => n !== i) })
            }
          />
        )}
      </SortableOptions>
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
