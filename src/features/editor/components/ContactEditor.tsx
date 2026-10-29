import { useT } from '../../../i18n';
import { useId, useRef } from 'react';
import type { Contact } from '../../../core/types';
import { avatarSource, FALLBACK_AVATAR } from '../../../core/defaults';
import { TextField } from '../../../components/ui/Field';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Button } from '../../../components/ui/Button';
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
        <Button
          variant="ghost"
          className="upload-button"
          aria-label={t('contact.changeLabel')}
          onClick={() => fileInput.current?.click()}
        >
          {t('contact.change')}
        </Button>
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
        <Button variant="ghost" onClick={() => onChange({ ...contact, avatar: '' })}>
          {t('contact.remove')}
        </Button>
      </div>
    </section>
  );
}
