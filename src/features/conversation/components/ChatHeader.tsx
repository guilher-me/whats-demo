import type { Contact } from '../../../core/types';
import { avatarSource, FALLBACK_AVATAR } from '../../../core/defaults';
import { VerifiedIcon } from '../../../components/icons/WhatsAppIcons';
export function ChatHeader({ contact, typing }: { contact: Contact; typing: boolean }) {
  return (
    <header className="chat-header">
      <img
        src={avatarSource(contact.avatar)}
        alt=""
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = FALLBACK_AVATAR;
        }}
      />
      <div>
        <strong title={contact.name}>{contact.name.trim() || 'Contato'}</strong>
        {contact.verified && (
          <span className="verified" aria-label="Conta verificada">
            <VerifiedIcon />
          </span>
        )}
        <small>{typing ? 'digitando…' : 'Conta comercial'}</small>
      </div>
      <span className="dots" aria-hidden="true">
        ⋮
      </span>
    </header>
  );
}
