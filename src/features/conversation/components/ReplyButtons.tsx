import { useEffect, useRef, useState } from 'react';
import { useT } from '../../../i18n';
import type { MessageButton } from '../../../core/types';
import { buttonLabel, buttonType, isReplyButton } from '../../../core/message-buttons';
import { MessageButtonIcon } from '../../../components/icons/MessageButtonIcon';
import { PhoneSheet } from '../../../components/ui/PhoneSheet';
import { MessageAction } from './MessageAction';
import { ButtonActionSheet } from './ButtonActionSheet';

export function ReplyButtons({
  options,
  selected,
  disabled,
  onSelect,
  groupId,
}: {
  options: MessageButton[];
  selected?: string;
  disabled: boolean;
  onSelect: (id: string) => void;
  groupId?: string;
}) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const action = options.find((o) => o.id === actionId && !isReplyButton(o));
  useEffect(() => {
    setExpanded(false);
    setActionId(null);
  }, [groupId]);
  const container = () => ref.current?.closest<HTMLElement>('.phone') ?? null;
  const choose = (button: MessageButton) => {
    setExpanded(false);
    if (isReplyButton(button)) onSelect(button.id);
    else setActionId(button.id);
  };
  const renderButton = (o: MessageButton) => (
    <MessageAction
      key={o.id}
      data-choice-id={o.id}
      disabled={disabled}
      aria-pressed={selected === o.id}
      onClick={() => choose(o)}
    >
      <span className="message-button-content">
        <MessageButtonIcon type={buttonType(o)} />
        <span>{buttonLabel(o)}</span>
      </span>
    </MessageAction>
  );
  return (
    <div ref={ref} className="message-actions" aria-label={t('editor.buttons')}>
      {(options.length > 3 ? options.slice(0, 2) : options).map(renderButton)}
      {options.length > 3 && (
        <MessageAction
          data-open-buttons
          disabled={disabled}
          onClick={() => setExpanded(true)}
          aria-haspopup="dialog"
          aria-expanded={expanded}
        >
          {t('buttons.seeAll')}
        </MessageAction>
      )}
      {expanded && (
        <PhoneSheet
          container={container()}
          title={t('buttons.seeAll')}
          description={t('buttons.choose')}
          onClose={() => setExpanded(false)}
        >
          <div className="button-sheet-options" data-buttons-for={groupId}>
            {options.map(renderButton)}
          </div>
        </PhoneSheet>
      )}
      {action && (
        <ButtonActionSheet
          button={action}
          container={container()}
          onClose={() => setActionId(null)}
          onConfirm={() => {
            setActionId(null);
            onSelect(action.id);
          }}
        />
      )}
    </div>
  );
}
