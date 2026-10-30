import { useT } from '../../../i18n';
import type { ReactNode } from 'react';
import type { MessageOption } from '../../../core/types';
import { TextField } from '../../../components/ui/Field';
import { ActionMenu } from '../../../components/ui/ActionMenu';
export function MessageOptionEditor({
  option,
  index,
  description = false,
  removable,
  dragHandle,
  onChange,
  onRemove,
  titleLimit,
  titleDisabled = false,
  children,
}: {
  option: MessageOption;
  index: number;
  description?: boolean;
  removable: boolean;
  dragHandle: ReactNode;
  onChange: (option: MessageOption) => void;
  onRemove: () => void;
  titleLimit?: number;
  titleDisabled?: boolean;
  children?: ReactNode;
}) {
  const t = useT();

  return (
    <div className="option-editor">
      <div className="option-editor-heading option-row">
        <span className="option-index">{String(index + 1).padStart(2, '0')}</span>
        <div className="option-title-field">
          <TextField
            label={description ? t('editor.optionTitle') : t('editor.buttonText')}
            value={option.title}
            maxLength={titleLimit ?? (description ? 24 : 20)}
            disabled={titleDisabled}
            onChange={(e) => onChange({ ...option, title: e.target.value })}
          />
        </div>
        <div className="option-editor-actions">
          <ActionMenu
            label={t('editor.optionActions', { v0: index + 1 })}
            items={[
              {
                label: t('editor.removeOption', { v0: index + 1 }),
                icon: 'trash',
                danger: true,
                disabled: !removable,
                onSelect: onRemove,
              },
            ]}
          />
          {dragHandle}
        </div>
      </div>
      {children}
      {description && (
        <details className="option-details">
          <summary>
            {t('editor.optionDetails')}
            {option.description && <span>{option.description}</span>}
          </summary>
          <TextField
            label={t('editor.optionDescription')}
            value={option.description ?? ''}
            maxLength={72}
            onChange={(e) => onChange({ ...option, description: e.target.value })}
          />
        </details>
      )}
    </div>
  );
}
