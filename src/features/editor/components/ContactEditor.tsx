import { useT } from '../../../i18n';
import type { Contact } from '../../../core/types';
import { BusinessAvatar } from '../../../components/ui/BusinessAvatar';
import { TextField } from '../../../components/ui/Field';
import { VerifiedBadgeCheckbox } from '../../../components/ui/VerifiedBadgeCheckbox';

export function ContactEditor({
  contact,
  onChange,
}: {
  contact: Contact;
  onChange: (contact: Contact) => void;
}) {
  const t = useT();
  return (
    <section className="contact-panel" aria-label={t('contact.region')}>
      <div className="contact-image">
        <BusinessAvatar />
      </div>
      <div className="contact-fields">
        <TextField
          label={t('contact.name')}
          value={contact.name}
          maxLength={80}
          onChange={(event) => onChange({ ...contact, name: event.target.value })}
        />
        <VerifiedBadgeCheckbox
          label={t('contact.verified')}
          checked={contact.verified}
          onChange={(verified) => onChange({ ...contact, verified })}
        />
      </div>
    </section>
  );
}
