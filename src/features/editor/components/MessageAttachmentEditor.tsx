import { useId } from 'react';
import type { MediaStep } from '../../../core/types';
import {
  documentBaseName,
  documentSizeLimit,
  DOCUMENT_EXTENSIONS,
  DOCUMENT_UNITS,
  IMAGE_EXTENSIONS,
  isDocumentSize,
  MAX_DOCUMENT_NAME,
  MAX_CAPTION,
  MAX_DOCUMENT_MB,
  MAX_IMAGE_LABEL,
} from '../../../core/attachments';
import { ControlIcon } from '../../../components/icons/ControlIcon';
import { FieldError, TextField } from '../../../components/ui/Field';
import { SelectField } from '../../../components/ui/SelectField';
import { useT } from '../../../i18n';
import { MessageTextEditor } from './MessageTextEditor';

function ExtensionPicker<T extends string>({
  extensions,
  value,
  kind,
  onChange,
}: {
  extensions: readonly T[];
  value: T;
  kind: MediaStep['kind'];
  onChange: (extension: T) => void;
}) {
  const t = useT();
  const name = useId();
  return (
    <fieldset className="attachment-formats">
      <legend>{t('attachments.extension')}</legend>
      <div className="attachment-format-grid">
        {extensions.map((extension) => (
          <label key={extension} className="attachment-format-option">
            <input
              className="visually-hidden"
              type="radio"
              name={name}
              value={extension}
              checked={value === extension}
              onChange={() => onChange(extension)}
            />
            <span>
              <ControlIcon name={kind === 'image' ? 'photo' : 'file'} />.{extension}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function MessageAttachmentEditor({
  media,
  onChange,
}: {
  media: MediaStep;
  onChange: (media: MediaStep) => void;
}) {
  const t = useT();
  const errorId = useId();
  if (media.kind === 'image') {
    const { file } = media;
    return (
      <>
        <ExtensionPicker
          extensions={IMAGE_EXTENSIONS}
          value={file.extension}
          kind="image"
          onChange={(extension) => onChange({ ...media, file: { ...file, extension } })}
        />
        <TextField
          label={t('attachments.imageLabel')}
          maxLength={MAX_IMAGE_LABEL}
          value={file.name}
          placeholder="IMG"
          onChange={(event) =>
            onChange({ ...media, file: { ...file, name: event.currentTarget.value } })
          }
        />
        <MessageTextEditor
          label={t('attachments.caption')}
          value={media.caption ?? ''}
          maxLength={MAX_CAPTION}
          onChange={(caption) => onChange({ ...media, caption })}
        />
      </>
    );
  }

  const { file } = media;
  const missingName = !documentBaseName(file.name);
  const sizeError = !isDocumentSize(file.size, file.unit)
    ? t('attachments.documentSizeError', { max: MAX_DOCUMENT_MB })
    : '';
  return (
    <>
      <ExtensionPicker
        extensions={DOCUMENT_EXTENSIONS}
        value={file.extension}
        kind="document"
        onChange={(extension) => onChange({ ...media, file: { ...file, extension } })}
      />
      <TextField
        label={t('attachments.name')}
        hint={t('attachments.extensionHint', { extension: '.' + file.extension })}
        maxLength={MAX_DOCUMENT_NAME}
        aria-invalid={missingName || undefined}
        aria-describedby={missingName ? errorId + '-name' : undefined}
        value={file.name}
        onChange={(event) =>
          onChange({ ...media, file: { ...file, name: event.currentTarget.value } })
        }
      />
      <div className="attachment-document-size">
        <TextField
          label={t('attachments.size')}
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          max={documentSizeLimit(file.unit)}
          value={file.size ?? ''}
          aria-invalid={!!sizeError || undefined}
          aria-describedby={sizeError ? errorId + '-size' : undefined}
          onChange={(event) => {
            const value = event.currentTarget.valueAsNumber;
            onChange({
              ...media,
              file: { ...file, size: Number.isFinite(value) ? value : undefined },
            });
          }}
        />
        <SelectField
          label={t('attachments.sizeUnit')}
          value={file.unit}
          options={DOCUMENT_UNITS.map((unit) => ({ value: unit, label: unit }))}
          onValueChange={(value) => {
            const unit = DOCUMENT_UNITS.find((unit) => unit === value);
            if (unit) onChange({ ...media, file: { ...file, unit } });
          }}
        />
      </div>
      {missingName && (
        <FieldError id={errorId + '-name'}>{t('attachments.documentNameRequired')}</FieldError>
      )}
      <FieldError id={errorId + '-size'}>{sizeError}</FieldError>
    </>
  );
}
