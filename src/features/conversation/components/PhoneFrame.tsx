import { useT } from '../../../i18n';
import type { ReactNode, RefObject } from 'react';
import type { Contact } from '../../../core/types';
import { ChatHeader } from './ChatHeader';
export function PhoneFrame({
  contact,
  typing = false,
  paused = false,
  pixCopied = false,
  phoneRef,
  children,
}: {
  contact: Contact;
  typing?: boolean;
  paused?: boolean;
  pixCopied?: boolean;
  phoneRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const t = useT();

  return (
    <div
      className="phone"
      inert={paused}
      data-paused={paused || undefined}
      id="phone-preview"
      role="region"
      aria-label={t('phone.region')}
      ref={phoneRef}
    >
      <ChatHeader contact={contact} typing={typing} />
      {children}
      <div className="phone-pix-notice" role="status">
        {pixCopied && <span>{t('commerce.pixCopied')}</span>}
      </div>
    </div>
  );
}
