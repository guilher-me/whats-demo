import { buttonLabel, isReplyButton } from '../../../core/message-buttons';
import { useT } from '../../../i18n';
import type { BusinessInteractive, MessageStep } from '../../../core/types';
import { createInteractive, businessMessageError, messageOptions } from '../../../core/interactive';
import { TextField, FieldError } from '../../../components/ui/Field';
import { MessageTextEditor } from './MessageTextEditor';
import { SelectField } from '../../../components/ui/SelectField';
import { ReplyButtonsEditor } from './ReplyButtonsEditor';
import { ListMessageEditor } from './ListMessageEditor';
import { MessageFormatPicker } from './MessageFormatPicker';
import { FormSection } from '../../../components/ui/FormSection';
export function BusinessMessageEditor({
  step,
  onChange,
}: {
  step: MessageStep;
  onChange: (change: Partial<MessageStep>) => void;
}) {
  const t = useT();

  const value = step.interactive;
  const error = businessMessageError(step);
  const update = (next: BusinessInteractive) => {
    if (
      next.autoReplyId &&
      !messageOptions(next).some(
        (o) =>
          o.id === next.autoReplyId &&
          (next.kind !== 'buttons' || !next.buttons.some(isReplyButton) || isReplyButton(o)),
      )
    )
      next = { ...next, autoReplyId: undefined };
    onChange({ interactive: next });
  };
  return (
    <>
      <MessageFormatPicker
        value={value?.kind ?? 'text'}
        onChange={(format) =>
          onChange({
            interactive: format === 'text' ? undefined : createInteractive(format),
          })
        }
      />
      <MessageTextEditor
        label={t('editor.messageText')}
        value={step.text}
        maxLength={value ? 1024 : undefined}
        onChange={(text) => onChange({ text })}
      />
      {value && (
        <>
          {value.kind === 'buttons' ? (
            <ReplyButtonsEditor value={value} onChange={update} />
          ) : (
            <ListMessageEditor value={value} onChange={update} />
          )}
          <FormSection title={t('editor.advanced')}>
            <TextField
              label={t('editor.header')}
              value={value.header ?? ''}
              maxLength={60}
              onChange={(e) => update({ ...value, header: e.target.value })}
            />
            <TextField
              label={t('editor.footer')}
              value={value.footer ?? ''}
              maxLength={60}
              onChange={(e) => update({ ...value, footer: e.target.value })}
            />
            <SelectField
              label={t('editor.autoReply')}
              value={value.autoReplyId ?? ''}
              onValueChange={(autoReplyId) => update({ ...value, autoReplyId })}
              options={[
                { value: '', label: t('editor.firstOption') },
                ...messageOptions(value)
                  .filter(
                    (option) =>
                      value.kind !== 'buttons' ||
                      !value.buttons.some(isReplyButton) ||
                      isReplyButton(option),
                  )
                  .map((option) => ({
                    value: option.id,
                    label: buttonLabel(option) || t('common.untitled'),
                  })),
              ]}
            />
          </FormSection>
          <FieldError>{error}</FieldError>
        </>
      )}
    </>
  );
}
