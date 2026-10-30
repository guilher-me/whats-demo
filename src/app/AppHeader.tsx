import { useT } from '../i18n';
import type { ReactNode } from 'react';
import brandIcon from '../../assets/whatsdemo-icon.svg';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';
import { PrivacyNotice } from '../features/privacy/PrivacyNotice';
import { AgentGuideLink } from '../features/automation/AgentGuideLink';
import { ControlIcon } from '../components/icons/ControlIcon';
import { version } from '../../package.json';
import { SaveIndicator } from '../features/editor/components/SaveIndicator';
import type { SaveState } from '../features/editor/hooks/useProject';
export function AppHeader({
  children,
  disabled,
  saveState,
}: {
  children: ReactNode;
  disabled?: boolean;
  saveState: SaveState;
}) {
  const t = useT();

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <img src={brandIcon} alt="" width="42" height="42" />
        </span>
        <div>
          <div className="brand-title">
            <h1>
              Whats<span>Demo</span>
            </h1>
            <span className="app-version">v{version}</span>
          </div>
          <div className="brand-meta">
            <SaveIndicator state={saveState} />
          </div>
        </div>
      </div>
      <nav className="header-links" aria-label={t('app.navigation')}>
        <PrivacyNotice disabled={disabled} />
        <AgentGuideLink />
        <a
          className="privacy-link agent-guide-link"
          href="https://github.com/guilher-me/whats-demo"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('app.githubLink')}
        >
          GitHub
          <ControlIcon name="external" width="12" height="12" />
        </a>
      </nav>
      <div className="header-actions">
        <LanguageSwitcher disabled={disabled} />
        {children}
      </div>
    </header>
  );
}
