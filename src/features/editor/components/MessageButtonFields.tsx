import { useT } from '../../../i18n';
import { buttonType } from '../../../core/message-buttons';
import type { MessageButton, MessageButtonType, ReplyButtonsMessage } from '../../../core/types';
import { TextField } from '../../../components/ui/Field';
import { SelectField } from '../../../components/ui/SelectField';

export function MessageButtonFields({
  button,
  context,
  onChange,
}: {
  button: MessageButton;
  context: ReplyButtonsMessage['context'];
  onChange: (button: MessageButton) => void;
}) {
  const t = useT();
  const types: MessageButtonType[] =
    context === 'template'
      ? ['quick_reply', 'url', 'phone_number', 'copy_code', 'voice_call']
      : ['quick_reply', 'url', 'voice_call'];
  // Retain an incompatible selection when context changes, so it can be corrected without losing data.
  if (!types.includes(buttonType(button))) types.push(buttonType(button));
  const type = buttonType(button);
  return (
    <div className="button-type-fields">
      <SelectField
        label={t('buttons.type')}
        value={type}
        options={types.map((value) => ({ value, label: t(`buttons.${value}`) }))}
        onValueChange={(next) =>
          onChange({
            id: button.id,
            title: next === 'copy_code' ? t('buttons.copyCode') : button.title,
            type: next as MessageButtonType,
            ...(next === 'url'
              ? { url: '' }
              : next === 'phone_number'
                ? { phoneNumber: '' }
                : next === 'copy_code'
                  ? { code: '' }
                  : {}),
          })
        }
      />
      {type === 'url' && (
        <TextField
          label={t('buttons.url')}
          aria-label={t('buttons.url')}
          type="url"
          maxLength={2000}
          placeholder="https://example.com"
          value={button.url ?? ''}
          hint={t('buttons.urlHint')}
          onChange={(e) => onChange({ ...button, url: e.target.value })}
        />
      )}
      {type === 'phone_number' && (
        <TextField
          label={t('buttons.phone')}
          type="tel"
          maxLength={20}
          placeholder="+15551234567"
          value={button.phoneNumber ?? ''}
          onChange={(e) => onChange({ ...button, phoneNumber: e.target.value })}
        />
      )}
      {type === 'copy_code' && (
        <TextField
          label={t('buttons.code')}
          maxLength={20}
          value={button.code ?? ''}
          onChange={(e) => onChange({ ...button, code: e.target.value })}
        />
      )}
      {type === 'voice_call' && (
        <TextField
          label={t('buttons.ttl')}
          type="number"
          min={context === 'template' ? 1440 : 1}
          max={43200}
          step={1}
          placeholder="10080"
          value={button.ttlMinutes ?? ''}
          onChange={(e) =>
            onChange({
              ...button,
              ttlMinutes: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
        />
      )}
    </div>
  );
}
