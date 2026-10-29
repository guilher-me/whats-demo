import type { ReactNode } from 'react';
import brandIcon from '../../assets/whatsdemo-icon.svg';
export function AppHeader({ status, children }: { status: string; children: ReactNode }) {
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
          <p>Crie conversas. Mostre experiências.</p>
        </div>
      </div>
      <div className="header-actions">
        <span className="save-status" role="status">
          {status}
        </span>
        {children}
      </div>
    </header>
  );
}
