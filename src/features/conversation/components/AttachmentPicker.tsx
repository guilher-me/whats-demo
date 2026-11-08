import { ControlIcon } from '../../../components/icons/ControlIcon';
import { CameraIcon, SendIcon } from '../../../components/icons/WhatsAppIcons';
import { Button } from '../../../components/ui/Button';
import { PhoneSheet } from '../../../components/ui/PhoneSheet';
import { MAX_CAPTION } from '../../../core/attachments';
import type { Attachment } from '../../../core/types';
import { useT } from '../../../i18n';
import type { Playback } from '../../playback/hooks/usePlayback';
import { AttachmentDetails, AttachmentTile, AttachmentVisual } from './AttachmentVisual';
import { useEffect, useRef } from 'react';

const choices = [
  { icon: 'photo', label: 'attachments.gallery', kind: 'image', color: 'blue' },
  { icon: 'camera', label: 'attachments.camera', color: 'pink' },
  { icon: 'pin', label: 'attachments.location', kind: 'location', color: 'green' },
  { icon: 'user', label: 'attachments.contact', color: 'cyan' },
  { icon: 'file', label: 'attachments.document', kind: 'document', color: 'purple' },
  { icon: 'headphones', label: 'attachments.audio', color: 'orange' },
  { icon: 'poll', label: 'attachments.poll', color: 'yellow' },
  { icon: 'calendar', label: 'attachments.event', color: 'pink' },
] as const;

function PhotoSendBar({
  photo,
  caption,
  disabled,
  onCaption,
  onReview,
  onSend,
}: {
  photo: Extract<Attachment, { kind: 'image' }>;
  caption: string;
  disabled: boolean;
  onCaption: (value: string) => void;
  onReview?: () => void;
  onSend: () => void;
}) {
  const t = useT();
  return (
    <form
      className="photo-send-bar"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onSend();
      }}
    >
      {onReview && (
        <button
          type="button"
          className="photo-review"
          aria-label={t('attachments.reviewPhoto')}
          onClick={onReview}
          disabled={disabled}
        >
          <AttachmentVisual item={photo} />
          <ControlIcon name="pencil" />
        </button>
      )}
      <input
        aria-label={t('attachments.caption')}
        placeholder={t('attachments.addCaption')}
        data-attachment-caption
        value={caption}
        maxLength={MAX_CAPTION}
        readOnly={disabled}
        onChange={(event) => onCaption(event.currentTarget.value)}
      />
      <button
        type="submit"
        className="photo-send"
        data-send-attachment
        aria-label={t('phone.send')}
        disabled={disabled}
      >
        <SendIcon />
        {onReview && <span aria-hidden="true">1</span>}
      </button>
    </form>
  );
}

export function AttachmentPicker({
  media,
  container,
  disabled,
  onSend,
  onSendLocation,
}: {
  media: Playback['media'];
  container: HTMLElement | null;
  disabled: boolean;
  onSend: () => void;
  onSendLocation: (id: string) => void;
}) {
  const t = useT();
  const session = media.session;
  const content = useRef<HTMLDivElement>(null);
  const view = session?.view;
  useEffect(() => {
    if (disabled || view === 'closed') return;
    const field =
      content.current?.querySelector<HTMLElement>('button[aria-pressed="true"]') ??
      content.current?.querySelector<HTMLElement>('button:not(:disabled)') ??
      content.current?.closest('.phone-sheet')?.querySelector<HTMLElement>('header button');
    field?.focus();
  }, [view, disabled]);
  if (!session || session.view === 'closed') return null;
  const menu = session.view === 'menu';
  const location = session.kind === 'location' && session.view === 'items';
  const point = location
    ? session.items.find((item) => item.kind === 'location' && item.id === session.configuredId)
    : undefined;
  const gallery = session.kind === 'image' && session.view === 'items';
  const photo = session.selected?.kind === 'image' ? session.selected : undefined;
  const review = !!photo && session.view === 'preview';
  const title = menu
    ? t('attachments.attach')
    : location
      ? t('attachments.sendLocation')
      : gallery
        ? t('attachments.recents')
        : session.view === 'items'
          ? t('attachments.document')
          : t('attachments.preview');
  return (
    <PhoneSheet
      container={container}
      title={title}
      description={t(menu ? 'attachments.menuHint' : 'attachments.pickerHint')}
      className={
        menu
          ? 'android-attachment-menu'
          : location
            ? 'location-picker'
            : gallery
              ? 'android-photo-gallery'
              : review
                ? 'android-photo-review'
                : undefined
      }
      hideHeader={menu}
      backdrop={menu ? 'clear' : gallery || review || location ? 'dimmed' : undefined}
      closeLabel={t(review ? 'attachments.back' : 'common.closeDialog')}
      onClose={() => {
        if (disabled) return;
        if (review) media.back();
        else media.close();
      }}
      onReturnFocus={() => {
        if (!disabled) container?.querySelector<HTMLElement>('[data-attach]')?.focus();
      }}
    >
      {menu ? (
        <div className="attachment-menu" ref={content}>
          {choices.map((choice) => {
            const matches = 'kind' in choice && choice.kind === session.kind;
            return (
              <button
                type="button"
                key={choice.icon}
                data-attachment-kind={matches || undefined}
                disabled={disabled || !matches}
                onClick={media.showItems}
              >
                <span className={`attachment-menu-icon ${choice.color}`}>
                  {choice.icon === 'camera' ? <CameraIcon /> : <ControlIcon name={choice.icon} />}
                </span>
                {t(choice.label)}
              </button>
            );
          })}
        </div>
      ) : location && point ? (
        <div className="location-picker-content" ref={content}>
          <AttachmentVisual item={point} />
          <button
            type="button"
            className="location-choice current-location"
            data-attachment-item={point.id}
            disabled={disabled}
            onClick={() => onSendLocation(point.id)}
          >
            <ControlIcon name="pin" />
            <span>
              <strong>{t('attachments.sendCurrentLocation')}</strong>
              <small>
                {t('attachments.simulatedLocation')} · {point.name}
              </small>
            </span>
          </button>
          {session.items.length > 1 && (
            <section>
              <h3>{t('attachments.demoPlaces')}</h3>
              <ul className="location-list">
                {session.items.map(
                  (item) =>
                    item.kind === 'location' &&
                    item.id !== point.id && (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="location-choice"
                          data-attachment-item={item.id}
                          disabled={disabled}
                          onClick={() => onSendLocation(item.id)}
                        >
                          <ControlIcon name="pin" />
                          <span>
                            <strong>{item.name}</strong>
                            {item.address && <small>{item.address}</small>}
                          </span>
                        </button>
                      </li>
                    ),
                )}
              </ul>
            </section>
          )}
        </div>
      ) : gallery ? (
        <div className="photo-gallery-scroll" ref={content}>
          <ul className="photo-gallery-grid">
            {session.items.map(
              (item) =>
                item.kind === 'image' && (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-label={item.name}
                      data-attachment-item={item.id}
                      aria-pressed={photo?.id === item.id}
                      disabled={disabled}
                      onClick={() => media.select(item.id)}
                    >
                      <AttachmentVisual item={item} />
                      {photo?.id === item.id && (
                        <span className="photo-selection" aria-hidden="true">
                          1
                        </span>
                      )}
                    </button>
                  </li>
                ),
            )}
          </ul>
        </div>
      ) : review ? (
        <div className="photo-review-canvas" ref={content}>
          <AttachmentVisual item={photo} />
        </div>
      ) : (
        <div className="attachment-phone-content" ref={content}>
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
            </>
          )}
        </div>
      )}
      {photo && (gallery || review) && (
        <PhotoSendBar
          photo={photo}
          caption={session.caption}
          disabled={disabled}
          onCaption={media.caption}
          onReview={gallery ? media.reviewPhoto : undefined}
          onSend={onSend}
        />
      )}
      {!menu && (session.kind === 'document' || location) && (
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
