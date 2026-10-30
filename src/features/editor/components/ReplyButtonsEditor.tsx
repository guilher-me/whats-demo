import {
  buttonCountLimit,
  buttonLabel,
  buttonTitleLimit,
  buttonType,
} from '../../../core/message-buttons';
import { SelectField } from '../../../components/ui/SelectField';
import { MessageButtonFields } from './MessageButtonFields';
import { useT } from '../../../i18n';
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
  const t = useT();
  const limit = buttonCountLimit(value);

  return (
    <div className="options-editor">
      <SelectField
        label={t('buttons.context')}
        value={value.context ?? 'interactive'}
        options={[
          { value: 'interactive', label: t('buttons.interactive') },
          { value: 'template', label: t('buttons.template') },
        ]}
        onValueChange={(context) =>
          onChange({ ...value, context: context as ReplyButtonsMessage['context'] })
        }
      />
      <p className="button-rules-hint">
        {t(value.context === 'template' ? 'buttons.templateHint' : 'buttons.interactiveHint')}
      </p>
      <div className="control-caption">
        <span>{t('editor.buttons')}</span>
        <small>
          {value.buttons.length}/{limit}
        </small>
      </div>
      <SortableOptions
        options={value.buttons}
        onChange={(buttons) => onChange({ ...value, buttons })}
      >
        {(option, i, dragHandle) => (
          <MessageOptionEditor
            key={option.id}
            option={{ ...option, title: buttonLabel(option) }}
            titleLimit={buttonTitleLimit(value, option)}
            titleDisabled={buttonType(option) === 'copy_code'}
            index={i}
            dragHandle={dragHandle}
            removable={value.buttons.length > 1}
            onChange={(next) =>
              onChange({ ...value, buttons: value.buttons.map((o, n) => (n === i ? next : o)) })
            }
            onRemove={() =>
              onChange({ ...value, buttons: value.buttons.filter((_, n) => n !== i) })
            }
          >
            <MessageButtonFields
              button={option}
              context={value.context}
              onChange={(next) =>
                onChange({ ...value, buttons: value.buttons.map((o, n) => (n === i ? next : o)) })
              }
            />
          </MessageOptionEditor>
        )}
      </SortableOptions>
      <Button
        variant="ghost"
        disabled={value.buttons.length >= limit}
        onClick={() =>
          onChange({
            ...value,
            buttons: [
              ...value.buttons,
              { id: uid(), title: t('editor.optionNumber', { v0: value.buttons.length + 1 }) },
            ],
          })
        }
      >
        {t('editor.addButton')}
      </Button>
    </div>
  );
}
