import { useT } from '../../../i18n';
import { useEffect, useId, useRef, useState } from 'react';
import type { Contact } from '../../../core/types';
import { SafeAvatar } from '../../../components/ui/SafeAvatar';
import { IMAGE_ACCEPT } from '../../../core/images/policy';
import { sanitizePhotoFile } from '../../../core/images/sanitize';
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
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const latestContact = useRef(contact);
  latestContact.current = contact;
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  // Loading a different project or removing a photo cancels any stale upload result.
  useEffect(() => {
    generation.current++;
    setBusy(false);
  }, [contact.avatar]);
  const upload = async (file?: File) => {
    if (!file) return;
    const id = ++generation.current;
    setBusy(true);
    try {
      const avatar = await sanitizePhotoFile(file);
      if (generation.current !== id) return;
      onChange({ ...latestContact.current, avatar });
      onError('');
    } catch {
      if (generation.current === id) onError(t('contact.sizeError'));
    } finally {
      if (generation.current === id) setBusy(false);
    }
  };
  return (
    <section className="contact-panel" aria-label={t('contact.region')}>
      <div className="contact-image">
        <SafeAvatar
          value={contact.avatar}
          alt={t('contact.photo', { v0: contact.name.trim() || t('common.contactLower') })}
        />
        <div className="contact-photo-menu">
          <ActionMenu
            label={t('contact.changeLabel')}
            icon="photo"
            items={[
              {
                label: t('contact.change'),
                icon: 'photo',
                disabled: busy,
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
        {busy && <small role="status">{t('contact.processing')}</small>}
        <input
          id={id}
          ref={fileInput}
          aria-label={t('contact.select')}
          hidden
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={(e) => {
            void upload(e.target.files?.[0]);
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
