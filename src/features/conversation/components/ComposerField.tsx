import type { ReactNode } from 'react';
import { AttachmentIcon, CameraIcon, SmileyIcon } from '../../../components/icons/WhatsAppIcons';

export function ComposerField({ children, empty }: { children: ReactNode; empty: boolean }) {
  return (
    <div className="composer-field">
      <SmileyIcon className="composer-icon" />
      {children}
      <AttachmentIcon className="composer-icon" />
      {empty && <CameraIcon className="composer-icon" />}
    </div>
  );
}
