import type { MessageOption } from '../../../core/types';
import { MessageAction } from './MessageAction';
export function ReplyButtons({
  options,
  selected,
  disabled,
  onSelect,
}: {
  options: MessageOption[];
  selected?: string;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="message-actions" aria-label="Botões de resposta">
      {options.map((o) => (
        <MessageAction
          key={o.id}
          data-choice-id={o.id}
          disabled={disabled}
          aria-pressed={selected === o.id}
          onClick={() => onSelect(o.id)}
        >
          {o.title}
        </MessageAction>
      ))}
    </div>
  );
}
