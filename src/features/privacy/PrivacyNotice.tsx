import { useState } from 'react';
import { useT } from '../../i18n';
import { Dialog } from '../../components/ui/Dialog';

/** Informational notice: opening it never changes stored data or asks for consent. */
export function PrivacyNotice({ disabled }: { disabled?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={t('privacy.title')}
      description={t('privacy.description')}
      trigger={
        <button type="button" className="privacy-link" disabled={disabled}>
          {t('privacy.link')}
        </button>
      }
    >
      <div className="privacy-content">
        <section>
          <h3>{t('privacy.storageTitle')}</h3>
          <p>{t('privacy.storageBody')}</p>
        </section>
        <section>
          <h3>{t('privacy.sharingTitle')}</h3>
          <p>{t('privacy.sharingBody')}</p>
        </section>
        <section>
          <h3>{t('privacy.deleteTitle')}</h3>
          <p>{t('privacy.deleteBody')}</p>
        </section>
        <section>
          <h3>{t('privacy.connectionsTitle')}</h3>
          <p>{t('privacy.connectionsBody')}</p>
        </section>
      </div>
    </Dialog>
  );
}
