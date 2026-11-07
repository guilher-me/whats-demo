import { useState, type FormEvent } from 'react';
import { useT } from '../../../i18n';
import type { Attachment, AttachmentKind } from '../../../core/types';
import {
  MAX_ATTACHMENT_NAME,
  MAX_ATTACHMENTS,
  MAX_DOCUMENT_SIZE_LABEL,
} from '../../../core/attachments';
import { uid } from '../../../core/project';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { FieldError, TextField } from '../../../components/ui/Field';
import { AttachmentTile } from '../../conversation/components/AttachmentVisual';

export function AttachmentDialog({
  kind,
  items,
  atLimit,
  imageName,
  onClose,
  onSelect,
  onCreate,
}: {
  kind: AttachmentKind;
  items: Attachment[];
  atLimit: boolean;
  imageName: string;
  onClose: () => void;
  onSelect: (item: Attachment) => void;
  onCreate: (item: Attachment) => void;
}) {
  const t = useT();
  const [creating, setCreating] = useState(!items.length && !atLimit);
  const [name, setName] = useState('');
  const [sizeLabel, setSizeLabel] = useState('');
  const [error, setError] = useState('');
  const createLabel = t(
    kind === 'image' ? 'attachments.createImage' : 'attachments.createDocument',
  );

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (atLimit) return;
    const id = uid();
    try {
      onCreate(
        kind === 'image'
          ? { id, kind, name: name.trim() || imageName }
          : { id, kind, name: name.trim(), sizeLabel: sizeLabel.trim() },
      );
      onClose();
    } catch (failure) {
      setError((failure as Error).message);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={creating ? createLabel : t('attachments.choose')}
    >
      {creating ? (
        <form className="attachment-form" onSubmit={save}>
          <TextField
            label={t(kind === 'image' ? 'attachments.imageName' : 'attachments.name')}
            value={name}
            maxLength={MAX_ATTACHMENT_NAME}
            required={kind === 'document'}
            placeholder={kind === 'image' ? imageName : 'catalog.pdf'}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          {kind === 'document' && (
            <TextField
              label={t('attachments.size')}
              value={sizeLabel}
              placeholder="240 KB"
              maxLength={MAX_DOCUMENT_SIZE_LABEL}
              required
              onChange={(event) => setSizeLabel(event.currentTarget.value)}
            />
          )}
          <FieldError>{error}</FieldError>
          <div className="dialog-actions">
            <Button onClick={items.length ? () => setCreating(false) : onClose}>
              {t(items.length ? 'attachments.back' : 'common.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={kind === 'document' && (!name.trim() || !sizeLabel.trim())}
            >
              {t('attachments.save')}
            </Button>
          </div>
        </form>
      ) : (
        <>
          {items.length ? (
            <ul className="attachment-grid">
              {items.map((item) => (
                <li key={item.id}>
                  <AttachmentTile item={item} onClick={() => onSelect(item)} />
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('attachments.noChoices')}</p>
          )}
          <Button disabled={atLimit} onClick={() => setCreating(true)}>
            {createLabel}
          </Button>
          {atLimit && <p>{t('attachments.limit', { count: MAX_ATTACHMENTS })}</p>}
        </>
      )}
    </Dialog>
  );
}
