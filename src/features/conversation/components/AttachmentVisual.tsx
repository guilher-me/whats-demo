import { ControlIcon } from '../../../components/icons/ControlIcon';
import type { Attachment } from '../../../core/types';
import { LocationMap } from './LocationMap';
import { useT } from '../../../i18n';

export function AttachmentVisual({ item }: { item: Attachment }) {
  if (item.kind === 'location') return <LocationMap />;
  return item.kind === 'image' ? (
    <span className="attachment-image-placeholder" aria-hidden="true">
      <ControlIcon name="photo" />
      <span>{item.name}</span>
      <small className="attachment-image-extension">{item.extension.toUpperCase()}</small>
    </span>
  ) : (
    <span className="attachment-file-icon" aria-hidden="true">
      <ControlIcon name="file" />
      {item.extension.toUpperCase()}
    </span>
  );
}

export function AttachmentDetails({ item }: { item: Attachment }) {
  const t = useT();
  return (
    <div className="attachment-details">
      <AttachmentVisual item={item} />
      {item.kind === 'location' && (
        <div className="location-details-text">
          {item.address && <p>{item.address}</p>}
          <small>{t('attachments.simulatedLocation')}</small>
        </div>
      )}
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
