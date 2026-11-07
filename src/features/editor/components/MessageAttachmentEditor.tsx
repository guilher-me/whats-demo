import type { Attachment, MessageStep } from '../../../core/types';
import { MAX_CAPTION } from '../../../core/attachments';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/Field';
import { useT } from '../../../i18n';
import { AttachmentVisual } from '../../conversation/components/AttachmentVisual';
import { MessageTextEditor } from './MessageTextEditor';

export function MessageAttachmentEditor({
  step,
  attachment,
  onChoose,
  onChange,
}: {
  step: MessageStep;
  attachment?: Attachment;
  onChoose: () => void;
  onChange: (change: Partial<MessageStep>) => void;
}) {
  const t = useT();
  const media = step.media;
  return (
    <>
      {attachment && (
        <div className="attachment-selected">
          <span className="attachment-square">
            <AttachmentVisual item={attachment} />
          </span>
          <span>{attachment.name}</span>
        </div>
      )}
      <Button onClick={onChoose}>{t('attachments.choose')}</Button>
      {!attachment && <FieldError>{t('attachments.required')}</FieldError>}
      {media?.kind === 'image' && (
        <MessageTextEditor
          label={t('attachments.caption')}
          value={media.caption ?? ''}
          maxLength={MAX_CAPTION}
          onChange={(caption) => onChange({ media: { ...media, caption } })}
        />
      )}
    </>
  );
}
