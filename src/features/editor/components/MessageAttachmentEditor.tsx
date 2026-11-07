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
  alternatives = [],
  onChoose,
  onChange,
}: {
  step: MessageStep;
  attachment?: Attachment;
  alternatives?: Attachment[];
  onChoose: (alternative?: boolean) => void;
  onChange: (change: Partial<MessageStep>) => void;
}) {
  const t = useT();
  const media = step.media;
  if (!media) return null;
  return (
    <>
      {attachment && (
        <div className="attachment-selected">
          <span className="attachment-square">
            <AttachmentVisual item={attachment} />
          </span>
          <div>
            <strong>{attachment.name}</strong>
            {step.type === 'user' && <small>{t('attachments.automatic')}</small>}
          </div>
        </div>
      )}
      <Button onClick={() => onChoose()}>{t('attachments.choose')}</Button>
      {!attachment && <FieldError>{t('attachments.required')}</FieldError>}
      {step.type === 'user' && attachment && (
        <div className="attachment-alternatives">
          {alternatives.length > 0 && (
            <ul aria-label={t('attachments.alternatives')}>
              {alternatives.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      onChange({
                        media: {
                          ...media,
                          attachmentId: item.id,
                          alternativeIds: alternatives.map((option) =>
                            option.id === item.id ? attachment.id : option.id,
                          ),
                        },
                      })
                    }
                  >
                    {t('attachments.useAutomatically', { name: item.name })}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      onChange({
                        media: {
                          ...media,
                          alternativeIds: alternatives
                            .filter((option) => option.id !== item.id)
                            .map((option) => option.id),
                        },
                      })
                    }
                  >
                    {t('attachments.removeAlternative', { name: item.name })}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button variant="ghost" onClick={() => onChoose(true)}>
            {t('attachments.addAlternative')}
          </Button>
        </div>
      )}
      {media.kind === 'image' && (
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
