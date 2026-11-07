import { ControlIcon } from '../../../components/icons/ControlIcon';
import type { Attachment } from '../../../core/types';
import { useT } from '../../../i18n';

export function AttachmentVisual({ item }: { item: Attachment }) {
  return item.kind === 'image' ? (
    <span className="attachment-image-placeholder" aria-hidden="true">
      <ControlIcon name="photo" />
      <span>{item.name}</span>
    </span>
  ) : (
    <span className="attachment-file-icon" aria-hidden="true">
      <ControlIcon name="file" />
      PDF
    </span>
  );
}

export function AttachmentDetails({ item }: { item: Attachment }) {
  const t = useT();
  return (
    <div className="attachment-details">
      <AttachmentVisual item={item} />
      {item.kind === 'document' && (
        <p>
          {t('attachments.simulated')} · {item.sizeLabel}
        </p>
      )}
    </div>
  );
}

export function AttachmentTile({
  item,
  onClick,
  disabled,
}: {
  item: Attachment;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="attachment-tile"
      onClick={onClick}
      title={item.name}
      data-attachment-item={item.id}
      disabled={disabled}
    >
      <span className="attachment-square">
        <AttachmentVisual item={item} />
      </span>
      <span className="attachment-name">{item.name}</span>
      {item.kind === 'document' && <small>{item.sizeLabel}</small>}
    </button>
  );
}
