import type { ReactNode, RefObject } from 'react';
import type { Contact } from '../../../core/types';
import { ChatHeader } from './ChatHeader';
export function PhoneFrame({
  contact,
  typing = false,
  phoneRef,
  children,
}: {
  contact: Contact;
  typing?: boolean;
  phoneRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div
      className="phone"
      id="phone-preview"
      role="region"
      aria-label="Celular de prévia"
      ref={phoneRef}
    >
      <ChatHeader contact={contact} typing={typing} />
      {children}
    </div>
  );
}
