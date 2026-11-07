import type { ReactNode } from 'react';
import { AttachmentIcon, CameraIcon, SmileyIcon } from '../../../components/icons/WhatsAppIcons';
import { useT } from '../../../i18n';

export function ComposerField({
  children,
  empty,
  onAttach,
  attachmentDisabled,
}: {
  children: ReactNode;
  empty: boolean;
  onAttach?: () => void;
  attachmentDisabled?: boolean;
}) {
  const t = useT();
  return (
    <div className="composer-field">
      <SmileyIcon className="composer-icon" />
      {children}
      {onAttach ? (
        <button
          type="button"
          className="composer-attach"
          data-attach
          aria-label={t('attachments.attach')}
          onClick={onAttach}
          disabled={attachmentDisabled}
        >
          <AttachmentIcon className="composer-icon" />
        </button>
      ) : (
        <AttachmentIcon className="composer-icon" />
      )}
      {empty && <CameraIcon className="composer-icon" />}
    </div>
  );
}
