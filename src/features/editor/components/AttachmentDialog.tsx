import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useT } from '../../../i18n';
import type { Attachment, AttachmentKind } from '../../../core/types';
import {
  MAX_ATTACHMENT_NAME,
  MAX_ATTACHMENTS,
  MAX_DOCUMENT_SIZE_LABEL,
} from '../../../core/attachments';
import { IMAGE_ACCEPT } from '../../../core/images/policy';
import { sanitizePhotoFile } from '../../../core/images/sanitize';
import { uid } from '../../../core/project';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { FieldError, TextField } from '../../../components/ui/Field';
import { AttachmentTile } from '../../conversation/components/AttachmentVisual';

export function AttachmentDialog({
  kind,
  customer,
  items,
  atLimit,
  onClose,
  onSelect,
  onCreate,
}: {
  kind?: AttachmentKind;
  customer: boolean;
  items: Attachment[];
  atLimit: boolean;
  onClose: () => void;
  onSelect?: (item: Attachment) => void;
  onCreate: (item: Attachment) => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<AttachmentKind | undefined>();
  const [name, setName] = useState('');
  const [sizeLabel, setSizeLabel] = useState('');
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(
    () => () => {
      ++request.current;
    },
    [],
  );

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!mode || busy || atLimit) return;
    const attempt = ++request.current;
    setBusy(true);
    setError('');
    let source: string | undefined;
    try {
      if (file) source = await sanitizePhotoFile(file);
    } catch {
      if (attempt === request.current) {
        setBusy(false);
        setError(t('attachments.invalidImage', { v0: file?.name }));
      }
      return;
    }
    if (attempt !== request.current) return;
    try {
      const base = { id: uid(), name: name.trim(), customerVisible: customer };
      if (mode === 'image' && source) onCreate({ ...base, kind: 'image', source });
      else if (mode === 'document')
        onCreate({ ...base, kind: 'document', sizeLabel: sizeLabel.trim(), cover: source });
      onClose();
    } catch (failure) {
      setError((failure as Error).message);
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(
        mode === 'image'
          ? 'attachments.upload'
          : mode === 'document'
            ? 'attachments.createDocument'
            : onSelect
              ? 'attachments.choose'
              : 'attachments.add',
      )}
    >
      {mode ? (
        <form className="attachment-form" onSubmit={(event) => void save(event)}>
          <TextField
            label={t(mode === 'image' ? 'attachments.imageFile' : 'attachments.cover')}
            type="file"
            accept={IMAGE_ACCEPT}
            required={mode === 'image'}
            disabled={busy}
            onChange={(event) => {
              const selected = event.currentTarget.files?.[0];
              setFile(selected);
              if (mode === 'image' && selected && !name)
                setName(selected.name.slice(0, MAX_ATTACHMENT_NAME));
            }}
          />
          <TextField
            label={t('attachments.name')}
            value={name}
            maxLength={MAX_ATTACHMENT_NAME}
            required
            disabled={busy}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          {mode === 'document' && (
            <TextField
              label={t('attachments.size')}
              value={sizeLabel}
              placeholder="240 KB"
              maxLength={MAX_DOCUMENT_SIZE_LABEL}
              required
              disabled={busy}
              onChange={(event) => setSizeLabel(event.currentTarget.value)}
            />
          )}
          <FieldError>{error}</FieldError>
          <div className="dialog-actions">
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              type="submit"
              disabled={busy || !name.trim() || (mode === 'image' ? !file : !sizeLabel.trim())}
            >
              {t('attachments.save')}
            </Button>
          </div>
        </form>
      ) : (
        <>
          {onSelect &&
            (items.length ? (
              <ul className="attachment-grid">
                {items.map((item) => (
                  <li key={item.id}>
                    <AttachmentTile item={item} onClick={() => onSelect(item)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('attachments.noChoices')}</p>
            ))}
          <div className="dialog-actions">
            {(!kind || kind === 'image') && (
              <Button disabled={atLimit} onClick={() => setMode('image')}>
                {t('attachments.upload')}
              </Button>
            )}
            {(!kind || kind === 'document') && (
              <Button disabled={atLimit} onClick={() => setMode('document')}>
                {t('attachments.createDocument')}
              </Button>
            )}
          </div>
          {atLimit && <p>{t('attachments.limit', { count: MAX_ATTACHMENTS })}</p>}
        </>
      )}
    </Dialog>
  );
}
