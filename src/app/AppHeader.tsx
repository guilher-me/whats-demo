import type { ReactNode } from 'react';
export function AppHeader({ status, children }: { status: string; children: ReactNode }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          ◔
        </span>
        <div>
          <h1>WhatsApp Fake Flows</h1>
          <p>Seu roteiro. A conversa inteira.</p>
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
