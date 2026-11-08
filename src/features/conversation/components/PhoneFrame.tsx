import { useT } from '../../../i18n';
import type { ReactNode, RefObject } from 'react';
import type { Contact } from '../../../core/types';
import { ChatHeader } from './ChatHeader';
export function PhoneFrame({
  contact,
  time,
  paused = false,
  pixCopied = false,
  phoneRef,
  children,
}: {
  contact: Contact;
  time: string;
  paused?: boolean;
  pixCopied?: boolean;
  phoneRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const t = useT();

  return (
    <div className="phone-device">
      <div className="phone-side-keys" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div
        className="phone"
        inert={paused}
        data-paused={paused || undefined}
        id="phone-preview"
        role="region"
        aria-label={t('phone.region')}
        ref={phoneRef}
      >
        <div className="phone-status" aria-hidden="true">
          <div className="phone-status-group">
            <svg width="30" height="13" viewBox="0 0 32 14" fill="currentColor" focusable="false">
              <path d="M1 9h2v4H1zm3-2h2v6H4zm3-2h2v8H7zm3-2h2v10h-2z" />
              <path
                d="M17 5a10 10 0 0 1 14 0m-12 2a7 7 0 0 1 10 0m-8 2a4 4 0 0 1 6 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="24" cy="11.5" r="1.15" />
            </svg>
            <span className="phone-time">{time}</span>
          </div>
          <span className="phone-camera" />
          <div className="phone-status-group phone-status-battery">
            <span>100%</span>
            <svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor" focusable="false">
              <rect x="1" y="2" width="15" height="8" rx="1.5" fill="none" stroke="currentColor" />
              <rect x="2.75" y="3.75" width="11.5" height="4.5" rx=".5" />
              <rect x="17.25" y="4.5" width="1.5" height="3" rx=".6" />
            </svg>
          </div>
        </div>
        <ChatHeader contact={contact} />
        {children}
        <div className="phone-pix-notice" role="status">
          {pixCopied && <span>{t('commerce.pixCopied')}</span>}
        </div>
      </div>
    </div>
  );
}
