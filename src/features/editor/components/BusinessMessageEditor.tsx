import { CommerceFields } from '../../commerce/CommerceEditor';
import { createMedia, isAttachmentKind } from '../../../core/attachments';
import { buttonLabel, isReplyButton } from '../../../core/message-buttons';
import { useT } from '../../../i18n';
import type { BusinessInteractive, MessageStep, Project } from '../../../core/types';
import { createInteractive, businessMessageError, messageOptions } from '../../../core/interactive';
import { TextField, FieldError } from '../../../components/ui/Field';
import { MessageTextEditor } from './MessageTextEditor';
import { SelectField } from '../../../components/ui/SelectField';
import { ReplyButtonsEditor } from './ReplyButtonsEditor';
import { ListMessageEditor } from './ListMessageEditor';
import { MessageFormatPicker } from './MessageFormatPicker';
import { FormSection } from '../../../components/ui/FormSection';
import { MessageAttachmentEditor } from './MessageAttachmentEditor';
export function BusinessMessageEditor({
  step,
  project,
  index,
  commerceError,
  onChange,
}: {
  step: MessageStep;
  project: Project;
  index: number;
  commerceError: string;
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
        value={step.commerce?.kind ?? step.media?.kind ?? value?.kind ?? 'text'}
        onChange={(format) =>
          onChange({
            commerce:
              format === 'product'
                ? { kind: 'product', sku: project.catalog?.[0]?.sku ?? '' }
                : format === 'showcase'
                  ? {
                      kind: 'showcase',
                      sections: [
                        {
                          title: t('commerce.sectionNumber', { v0: 1 }),
                          skus: [],
                        },
                      ],
                    }
                  : format === 'pix'
                    ? { kind: 'pix', amount: { cents: 0 } }
                    : undefined,
            interactive:
              format === 'buttons' || format === 'list' ? createInteractive(format) : undefined,
            media: isAttachmentKind(format) ? createMedia(format) : undefined,
          })
        }
      />
      {step.media ? (
        <MessageAttachmentEditor media={step.media} onChange={(media) => onChange({ media })} />
      ) : (
        <MessageTextEditor
          label={t('editor.messageText')}
          value={step.text}
          maxLength={value ? 1024 : undefined}
          onChange={(text) => onChange({ text })}
        />
      )}
      {step.commerce && (
        <CommerceFields
          value={step.commerce}
          project={project}
          index={index}
          error={commerceError}
          onChange={(commerce) => onChange({ commerce })}
        />
      )}
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
