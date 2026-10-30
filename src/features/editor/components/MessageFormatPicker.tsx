import { useId } from 'react';
import { useT } from '../../../i18n';
import { ControlIcon } from '../../../components/icons/ControlIcon';
export function MessageFormatPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: 'text' | 'buttons' | 'list') => void;
}) {
  const t = useT();
  const id = useId();
  return (
    <fieldset className="format-picker">
      <legend>{t('editor.format')}</legend>
      <div className="format-options">
        {[
          { value: 'text', label: t('editor.plainText'), icon: 'message' },
          { value: 'buttons', label: t('editor.buttons'), icon: 'manual' },
          { value: 'list', label: t('editor.list'), icon: 'flow' },
        ].map((option) => (
          <label key={option.value} className={value === option.value ? 'is-selected' : ''}>
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value as 'text' | 'buttons' | 'list')}
            />
            <ControlIcon name={option.icon as 'message' | 'manual' | 'flow'} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
