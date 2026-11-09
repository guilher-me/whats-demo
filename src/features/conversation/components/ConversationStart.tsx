import { useRef, useState, type RefObject } from 'react';
import { PhoneSheet } from '../../../components/ui/PhoneSheet';
import { currentLocale, useT } from '../../../i18n';

const helpLinks = {
  en: 'https://www.whatsapp.com/privacyquestions',
  es: 'https://faq.whatsapp.com/643460927283235/?lang=es',
  'pt-BR': 'https://faq.whatsapp.com/643460927283235/?locale=pt_BR',
};

export function ConversationStart({ phoneRef }: { phoneRef: RefObject<HTMLDivElement | null> }) {
  const t = useT();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="day">{t('phone.today')}</div>
      <button
        type="button"
        className="business-chat-notice"
        ref={trigger}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0Zm0 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-.65 2.75h1.3v4h-1.3v-4Z"
          />
        </svg>{' '}
        {t('phone.businessNotice')}{' '}
        <span className="business-chat-notice-learn">{t('phone.businessNoticeLearn')}</span>
      </button>
      {open && (
        <PhoneSheet
          container={phoneRef.current}
          title={t('phone.businessNoticeTitle')}
          description={t('phone.businessNotice')}
          onClose={() => setOpen(false)}
          onReturnFocus={() => trigger.current?.focus()}
          closeLabel={t('common.closeDialog')}
          backdrop="dimmed"
        >
          <div className="business-chat-notice-details">
            <p>{t('phone.businessNoticeDetails')}</p>
            <a href={helpLinks[currentLocale()]} target="_blank" rel="noreferrer">
              {t('phone.businessNoticeHelp')}
            </a>
          </div>
        </PhoneSheet>
      )}
    </>
  );
}
