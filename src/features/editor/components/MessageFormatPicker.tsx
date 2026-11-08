import { useId } from 'react';
import { useT } from '../../../i18n';
import { MessageButtonIcon } from '../../../components/icons/MessageButtonIcon';
import { ControlIcon } from '../../../components/icons/ControlIcon';
type Format = 'text' | 'buttons' | 'list' | 'image' | 'document' | 'product' | 'showcase' | 'pix';
export function MessageFormatPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: Format) => void;
}) {
  const t = useT();
  const id = useId();
  return (
    <fieldset className="format-picker">
      <legend>{t('editor.format')}</legend>
      <div className="format-options">
        {(
          [
            { value: 'text', label: t('editor.plainText'), icon: 'message' },
            { value: 'buttons', label: t('editor.buttons'), icon: 'manual' },
            { value: 'list', label: t('editor.list'), icon: 'list' },
            { value: 'image', label: t('attachments.image'), icon: 'photo' },
            { value: 'product', label: t('commerce.product'), icon: 'photo' },
            { value: 'showcase', label: t('commerce.showcase'), icon: 'flow' },
            { value: 'pix', label: t('commerce.pix'), icon: 'file' },
            { value: 'document', label: t('attachments.document'), icon: 'file' },
          ] as const
        ).map((option) => (
          <label key={option.value} className={value === option.value ? 'is-selected' : ''}>
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.icon === 'list' ? (
              <MessageButtonIcon type="list" />
            ) : (
              <ControlIcon name={option.icon} />
            )}
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
