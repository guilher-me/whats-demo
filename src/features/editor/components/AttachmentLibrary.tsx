import { useId, useState } from 'react';
import { AttachmentIcon } from '../../../components/icons/WhatsAppIcons';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/IconButton';
import { Checkbox } from '../../../components/ui/Checkbox';
import { ControlIcon } from '../../../components/icons/ControlIcon';
import type { Attachment, Step } from '../../../core/types';
import { MAX_ATTACHMENTS } from '../../../core/attachments';
import { useT } from '../../../i18n';
import { AttachmentTile } from '../../conversation/components/AttachmentVisual';

export function AttachmentLibrary({
  items,
  steps,
  onAdd,
  onPreview,
  onRemove,
  onVisibility,
}: {
  items: readonly Attachment[];
  steps: readonly Step[];
  onAdd: () => void;
  onPreview: (item: Attachment) => void;
  onRemove: (id: string) => void;
  onVisibility: (id: string, customerVisible: boolean) => void;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const body = useId();
  return (
    <section className="attachment-library" aria-label={t('attachments.library')}>
      <div className="attachment-library-header">
        <button
          type="button"
          className="attachment-disclosure"
          aria-expanded={expanded}
          aria-controls={body}
          onClick={() => setExpanded(!expanded)}
        >
          <AttachmentIcon width="18" height="18" />
          <span>
            <strong>{t('attachments.library')}</strong>
            <small>{t('attachments.count', { count: items.length })}</small>
          </span>
          <ControlIcon name="chevron" />
        </button>
        <Button
          onClick={() => {
            setExpanded(true);
            onAdd();
          }}
          disabled={items.length >= MAX_ATTACHMENTS}
        >
          {t('attachments.add')}
        </Button>
      </div>
      <div id={body} hidden={!expanded} className="attachment-library-body">
        {items.length === 0 && <p className="editor-hint">{t('attachments.empty')}</p>}
        <ul className="attachment-grid">
          {items.map((item) => {
            const uses = steps.flatMap((step, index) =>
              step.type !== 'flow' && step.media?.attachmentId === item.id
                ? [{ number: index + 1, customer: step.type === 'user' }]
                : [],
            );
            const customerUses = uses.filter((use) => use.customer);
            return (
              <li key={item.id}>
                <AttachmentTile item={item} onClick={() => onPreview(item)} />
                <div className="attachment-tile-actions">
                  <Checkbox
                    label={t('attachments.customerVisible')}
                    checked={item.customerVisible}
                    disabled={customerUses.length > 0}
                    onChange={(event) => onVisibility(item.id, event.currentTarget.checked)}
                  />
                  <IconButton
                    label={t('attachments.remove', { v0: item.name })}
                    disabled={uses.length > 0}
                    onClick={() => onRemove(item.id)}
                  >
                    <ControlIcon name="trash" />
                  </IconButton>
                </div>
                {uses.length > 0 && (
                  <small className="attachment-usage">
                    {t('attachments.usedBy', { v0: uses.map((use) => use.number).join(', ') })}
                  </small>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
