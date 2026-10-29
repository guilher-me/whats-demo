import { useT } from '../../../i18n';
import type { Contact } from '../../../core/types';
import { avatarSource, FALLBACK_AVATAR } from '../../../core/defaults';
import { VerifiedIcon } from '../../../components/icons/WhatsAppIcons';
export function ChatHeader({ contact, typing }: { contact: Contact; typing: boolean }) {
  const t = useT();

  return (
    <header className="chat-header">
      <img
        src={avatarSource(contact.avatar)}
        alt={t('contact.photo', { v0: contact.name.trim() || t('common.contactLower') })}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = FALLBACK_AVATAR;
        }}
      />
      <div>
        <strong title={contact.name}>{contact.name.trim() || t('common.contact')}</strong>
        {contact.verified && (
          <span className="verified" role="img" aria-label={t('phone.verified')}>
            <VerifiedIcon />
          </span>
        )}
        <small>{typing ? t('phone.typing') : t('phone.business')}</small>
      </div>
      <span className="dots" aria-hidden="true">
        ⋮
      </span>
    </header>
  );
}
