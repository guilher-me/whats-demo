import { useT } from '../../../i18n';
import type { Contact } from '../../../core/types';
import { BusinessAvatar } from '../../../components/ui/BusinessAvatar';
import { VerifiedIcon } from '../../../components/icons/WhatsAppIcons';
export function ChatHeader({ contact }: { contact: Contact }) {
  const t = useT();

  return (
    <header className="chat-header">
      <BusinessAvatar
        icon={contact.icon}
        iconBackground={contact.iconBackground}
        iconForeground={contact.iconForeground}
      />
      <div>
        <strong title={contact.name}>{contact.name.trim() || t('common.contact')}</strong>
        {contact.verified && (
          <span className="verified" role="img" aria-label={t('phone.verified')}>
            <VerifiedIcon />
          </span>
        )}
        <small>{t('phone.business')}</small>
      </div>
      <span className="dots" aria-hidden="true">
        ⋮
      </span>
    </header>
  );
}
