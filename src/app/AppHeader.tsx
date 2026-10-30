import { useT } from '../i18n';
import type { ReactNode } from 'react';
import brandIcon from '../../assets/whatsdemo-icon.svg';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';
import { PrivacyNotice } from '../features/privacy/PrivacyNotice';
export function AppHeader({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  const t = useT();

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <img src={brandIcon} alt="" width="42" height="42" />
        </span>
        <div>
          <h1>
            Whats<span>Demo</span>
          </h1>
          <div className="brand-meta">
            <p>{t('app.tagline')}</p>
            <PrivacyNotice disabled={disabled} />
          </div>
        </div>
      </div>
      <div className="header-actions">
        <LanguageSwitcher disabled={disabled} />
        {children}
      </div>
    </header>
  );
}
