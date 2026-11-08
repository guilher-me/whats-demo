import { offerOf } from '../../../core/commerce';
import { CommerceFields } from '../../commerce/CommerceEditor';
import { createMedia } from '../../../core/attachments';
import { useT } from '../../../i18n';
import type { MessageStep, Project } from '../../../core/types';
import { DEFAULT_VOICE_SECONDS, MAX_VOICE_SECONDS } from '../../../core/voice-message';
import { TextField } from '../../../components/ui/Field';
import { SelectField } from '../../../components/ui/SelectField';
import { MessageTextEditor } from './MessageTextEditor';
import { MessageAttachmentEditor } from './MessageAttachmentEditor';

export function CustomerMessageEditor({
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
  const seconds = step.voiceDurationSeconds;

  return (
    <>
      <SelectField
        label={t('editor.format')}
        value={
          step.commerce?.kind ?? step.media?.kind ?? (seconds === undefined ? 'text' : 'voice')
        }
        options={[
          { value: 'text', label: t('editor.plainText') },
          { value: 'cart', label: t('commerce.cart') },
          { value: 'voice', label: t('editor.voiceMock') },
          { value: 'image', label: t('attachments.image') },
          { value: 'document', label: t('attachments.document') },
        ]}
        onValueChange={(format) =>
          onChange({
            commerce:
              format === 'cart'
                ? {
                    kind: 'cart',
                    offerId:
                      project.steps
                        .slice(0, index)
                        .reverse()
                        .find((entry) => !!offerOf(entry))?.id ?? '',
                  }
                : undefined,
            voiceDurationSeconds: format === 'voice' ? DEFAULT_VOICE_SECONDS : undefined,
            media: format === 'image' || format === 'document' ? createMedia(format) : undefined,
          })
        }
      />
      {step.commerce ? (
        <CommerceFields
          value={step.commerce}
          project={project}
          index={index}
          error={commerceError}
          onChange={(commerce) => onChange({ commerce })}
        />
      ) : step.media ? (
        <MessageAttachmentEditor media={step.media} onChange={(media) => onChange({ media })} />
      ) : seconds === undefined ? (
        <MessageTextEditor
          label={t('editor.messageText')}
          value={step.text}
          onChange={(text) => onChange({ text })}
        />
      ) : (
        <TextField
          label={t('editor.voiceSeconds')}
          hint={t('editor.voiceSecondsHint')}
          type="number"
          min={1}
          max={MAX_VOICE_SECONDS}
          step={1}
          value={seconds}
          onChange={(event) =>
            onChange({
              voiceDurationSeconds: Math.min(
                MAX_VOICE_SECONDS,
                Math.max(1, Math.round(event.currentTarget.valueAsNumber) || 1),
              ),
            })
          }
        />
      )}
    </>
  );
}
