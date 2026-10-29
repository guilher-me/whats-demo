import { useT } from '../../../i18n';
import type { ReactNode } from 'react';
import type { MessageOption } from '../../../core/types';
import { TextField } from '../../../components/ui/Field';
import { IconButton } from '../../../components/ui/IconButton';
export function MessageOptionEditor({
  option,
  index,
  description = false,
  removable,
  dragHandle,
  onChange,
  onRemove,
}: {
  option: MessageOption;
  index: number;
  description?: boolean;
  removable: boolean;
  dragHandle: ReactNode;
  onChange: (option: MessageOption) => void;
  onRemove: () => void;
}) {
  const t = useT();

  return (
    <div className="option-editor">
      <div className="option-editor-heading">
        <span className="option-index">
          {description ? t('editor.option') : t('editor.button')} {index + 1}
        </span>
        <div className="option-editor-actions">
          <IconButton
            label={t('editor.removeOption', { v0: index + 1 })}
            disabled={!removable}
            onClick={onRemove}
          >
            ×
          </IconButton>
          {dragHandle}
        </div>
      </div>
      <TextField
        label={description ? t('editor.optionTitle') : t('editor.buttonText')}
        value={option.title}
        maxLength={description ? 24 : 20}
        onChange={(e) => onChange({ ...option, title: e.target.value })}
      />
      {description && (
        <TextField
          label={t('editor.optionDescription')}
          value={option.description ?? ''}
          maxLength={72}
          onChange={(e) => onChange({ ...option, description: e.target.value })}
        />
      )}
    </div>
  );
}
