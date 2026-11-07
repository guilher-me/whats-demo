import { ControlIcon } from '../../../components/icons/ControlIcon';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/Field';
import { PhoneSheet } from '../../../components/ui/PhoneSheet';
import { MAX_CAPTION } from '../../../core/attachments';
import { useT } from '../../../i18n';
import type { Playback } from '../../playback/hooks/usePlayback';
import { AttachmentDetails, AttachmentTile } from './AttachmentVisual';
import { useEffect, useRef } from 'react';

export function AttachmentPicker({
  media,
  container,
  disabled,
  onSend,
}: {
  media: Playback['media'];
  container: HTMLElement | null;
  disabled: boolean;
  onSend: () => void;
}) {
  const t = useT();
  const session = media.session;
  const content = useRef<HTMLDivElement>(null);
  const view = session?.view;
  useEffect(() => {
    if (disabled || view === 'closed') return;
    const field = content.current?.querySelector<HTMLElement>('input, button:not(:disabled)');
    field?.focus();
  }, [view, disabled]);
  if (!session || session.view === 'closed') return null;
  const kindLabel = t(session.kind === 'image' ? 'attachments.gallery' : 'attachments.document');
  const title =
    session.view === 'menu'
      ? t('attachments.attach')
      : session.view === 'items'
        ? kindLabel
        : t('attachments.preview');
  return (
    <PhoneSheet
      container={container}
      title={title}
      description={t(session.view === 'menu' ? 'attachments.menuHint' : 'attachments.pickerHint')}
      closeLabel={t('common.closeDialog')}
      onClose={() => {
        if (!disabled) media.close();
      }}
      onReturnFocus={() => {
        if (!disabled) container?.querySelector<HTMLElement>('[data-attach]')?.focus();
      }}
    >
      <div className="attachment-phone-content" ref={content}>
        {session.view === 'menu' && (
          <div className="attachment-menu">
            <Button
              data-attachment-kind={session.kind === 'image' || undefined}
              disabled={disabled || session.kind !== 'image'}
              onClick={media.showItems}
            >
              <ControlIcon name="photo" />
              {t('attachments.gallery')}
            </Button>
            <Button
              data-attachment-kind={session.kind === 'document' || undefined}
              disabled={disabled || session.kind !== 'document'}
              onClick={media.showItems}
            >
              <ControlIcon name="file" />
              {t('attachments.document')}
            </Button>
          </div>
        )}
        {session.view === 'items' && (
          <ul className="attachment-grid">
            {session.items.map((item) => (
              <li key={item.id}>
                <AttachmentTile
                  item={item}
                  disabled={disabled}
                  onClick={() => media.select(item.id)}
                />
              </li>
            ))}
          </ul>
        )}
        {session.view === 'preview' && session.selected && (
          <>
            <p className="attachment-preview-name">{session.selected.name}</p>
            <AttachmentDetails item={session.selected} />
            {session.kind === 'image' && (
              <TextField
                label={t('attachments.caption')}
                data-attachment-caption
                value={session.caption}
                maxLength={MAX_CAPTION}
                readOnly={disabled}
                onChange={(event) => media.caption(event.currentTarget.value)}
              />
            )}
          </>
        )}
      </div>
      {session.view !== 'menu' && (
        <footer className="attachment-picker-footer">
          <Button variant="ghost" onClick={media.back} disabled={disabled}>
            {t('attachments.back')}
          </Button>
          {session.view === 'preview' && (
            <Button variant="primary" data-send-attachment onClick={onSend} disabled={disabled}>
              {t('phone.send')}
            </Button>
          )}
        </footer>
      )}
    </PhoneSheet>
  );
}
