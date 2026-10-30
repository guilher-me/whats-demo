import { useT } from '../../../i18n';
import { useId, useRef } from 'react';
import type { Contact } from '../../../core/types';
import { avatarSource, FALLBACK_AVATAR } from '../../../core/defaults';
import { TextField } from '../../../components/ui/Field';
import { Checkbox } from '../../../components/ui/Checkbox';
import { ActionMenu } from '../../../components/ui/ActionMenu';
export function ContactEditor({
  contact,
  onChange,
  onError,
}: {
  contact: Contact;
  onChange: (contact: Contact) => void;
  onError: (message: string) => void;
}) {
  const t = useT();

  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      onError(t('contact.sizeError'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...contact, avatar: String(reader.result) });
      onError('');
    };
    reader.onerror = () => onError(t('contact.readError'));
    reader.readAsDataURL(file);
  };
  return (
    <section className="contact-panel" aria-label={t('contact.region')}>
      <div className="contact-image">
        <img
          src={avatarSource(contact.avatar)}
          alt={t('contact.photo', { v0: contact.name.trim() || t('common.contactLower') })}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_AVATAR;
          }}
        />
        <div className="contact-photo-menu">
          <ActionMenu
            label={t('contact.changeLabel')}
            icon="photo"
            items={[
              {
                label: t('contact.change'),
                icon: 'photo',
                onSelect: () => fileInput.current?.click(),
              },
              {
                label: t('contact.remove'),
                icon: 'trash',
                danger: true,
                disabled: !contact.avatar,
                onSelect: () => onChange({ ...contact, avatar: '' }),
              },
            ]}
          />
        </div>
        <input
          id={id}
          ref={fileInput}
          aria-label={t('contact.select')}
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <div className="contact-fields">
        <TextField
          label={t('contact.name')}
          value={contact.name}
          maxLength={80}
          onChange={(e) => onChange({ ...contact, name: e.target.value })}
        />
        <Checkbox
          label={t('contact.verified')}
          checked={contact.verified}
          onChange={(e) => onChange({ ...contact, verified: e.target.checked })}
        />
      </div>
    </section>
  );
}
