import { useT } from '../../../i18n';
import type { Contact } from '../../../core/types';
import { SafeAvatar } from '../../../components/ui/SafeAvatar';
import { VerifiedIcon } from '../../../components/icons/WhatsAppIcons';
export function ChatHeader({ contact, typing }: { contact: Contact; typing: boolean }) {
  const t = useT();

  return (
    <header className="chat-header">
      <SafeAvatar
        value={contact.avatar}
        alt={t('contact.photo', { v0: contact.name.trim() || t('common.contactLower') })}
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
