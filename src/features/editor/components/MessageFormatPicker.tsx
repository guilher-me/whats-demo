import { useId } from 'react';
import { useT } from '../../../i18n';
import { ControlIcon } from '../../../components/icons/ControlIcon';
type Format = 'text' | 'buttons' | 'list' | 'image' | 'document';
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
            { value: 'list', label: t('editor.list'), icon: 'flow' },
            { value: 'image', label: t('attachments.image'), icon: 'photo' },
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
            <ControlIcon name={option.icon} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
