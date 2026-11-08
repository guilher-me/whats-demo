import { useState } from 'react';
import { useT } from '../../../i18n';
import type { Contact } from '../../../core/types';
import { BusinessAvatar } from '../../../components/ui/BusinessAvatar';
import { Dialog } from '../../../components/ui/Dialog';
import { TextField } from '../../../components/ui/Field';
import { VerifiedBadgeCheckbox } from '../../../components/ui/VerifiedBadgeCheckbox';
import { ControlIcon } from '../../../components/icons/ControlIcon';
import { BusinessIconPicker } from './BusinessIconPicker';

export function ContactEditor({
  contact,
  onChange,
}: {
  contact: Contact;
  onChange: (contact: Contact) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <section className="contact-panel" aria-label={t('contact.region')}>
      <div className="contact-image">
        <BusinessAvatar
          icon={contact.icon}
          iconBackground={contact.iconBackground}
          iconForeground={contact.iconForeground}
        />
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title={t('contact.appearance')}
          description={t('contact.avatarDescription')}
          className="business-avatar-dialog"
          trigger={
            <button
              type="button"
              className="contact-avatar-edit"
              aria-label={t('contact.editAvatar')}
              title={t('contact.editAvatar')}
            >
              <ControlIcon name="pencil" width="14" height="14" />
            </button>
          }
        >
          {open && (
            <BusinessIconPicker
              contact={contact}
              onCancel={() => setOpen(false)}
              onApply={(avatar) => {
                if (
                  avatar.icon !== contact.icon ||
                  avatar.iconBackground !== contact.iconBackground ||
                  avatar.iconForeground !== contact.iconForeground
                ) {
                  onChange({ ...contact, ...avatar });
                }
                setOpen(false);
              }}
            />
          )}
        </Dialog>
      </div>
      <div className="contact-fields">
        <TextField
          label={t('contact.name')}
          data-journey-contact
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
