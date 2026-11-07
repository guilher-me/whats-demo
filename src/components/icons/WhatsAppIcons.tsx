import type { SVGProps } from 'react';
type Props = SVGProps<SVGSVGElement>;
const Base = ({ children, ...props }: Props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" {...props}>
    {children}
  </svg>
);
// Android composer symbols based on the WhatsApp Help Center illustrations.
export function AttachmentIcon(props: Props) {
  return (
    <Base {...props}>
      <path
        d="M17.5 6.8v10.3a5.5 5.5 0 0 1-11 0V6.8a3.7 3.7 0 0 1 7.4 0v9.5a1.8 1.8 0 0 1-3.6 0V7.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </Base>
  );
}
export function CameraIcon(props: Props) {
  return (
    <Base {...props}>
      <path
        fillRule="evenodd"
        d="M8.3 5 10 3.4h4L15.7 5H20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4.3ZM12 18a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm0-1.7a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z"
      />
    </Base>
  );
}
export function SendIcon(props: Props) {
  return (
    <Base {...props}>
      <path d="M4.4 19.43a.99.99 0 0 1-.95-.1.93.93 0 0 1-.45-.83V14l8-2-8-2V5.5c0-.37.15-.65.45-.84a1 1 0 0 1 .95-.09l15.4 6.5c.42.19.63.5.63.93 0 .43-.21.74-.63.93l-15.4 6.5Z" />
    </Base>
  );
}
export function MicrophoneIcon(props: Props) {
  return (
    <Base {...props}>
      <rect x="9" y="2.2" width="6" height="12" rx="3" />
      <path
        d="M6 11.7a6 6 0 0 0 12 0M12 17.7v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </Base>
  );
}
export function DeliveredIcon(props: Props) {
  return (
    <Base width="16" height="16" preserveAspectRatio="xMidYMid meet" {...props}>
      <path d="M14.73 6.01a1 1 0 0 1 1.41-.15l.01.01a1 1 0 0 1 .15 1.41L7.6 18.01a1 1 0 0 1-.73.37h-.05c-.26 0-.52-.11-.71-.3l-4.03-4.09a.99.99 0 0 1 0-1.41.99.99 0 0 1 1.41 0l3.25 3.29 7.99-9.86Zm5.71.12a1 1 0 0 1 1.41-.15h-.01a1 1 0 0 1 .15 1.41l-8.41 10.45a1 1 0 0 1-.73.37h-.05a1 1 0 0 1-.71-.3l-1.36-1.26a.55.55 0 0 1-.02-.81l.56-.68c.21-.2.53-.21.75-.03l.71.58 7.71-9.58Z" />
    </Base>
  );
}
export function SmileyIcon(props: Props) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <ellipse cx="9.3" cy="9.9" rx="1.3" ry="1.7" />
      <ellipse cx="14.7" cy="9.9" rx="1.3" ry="1.7" />
      <path
        fillRule="evenodd"
        d="M6.5 13a26.2 26.2 0 0 0 11 0c-.4 3-2.5 4.8-5.5 4.8S6.9 16 6.5 13Zm1.4 1.1c.8 1 2.1 1.5 4.1 1.5s3.3-.5 4.1-1.5a24 24 0 0 1-8.2 0Z"
      />
    </Base>
  );
}
export function VerifiedIcon(props: Props) {
  return (
    <Base width="14" height="14" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m22.69 11.22-.02-.01-1.6-1.63.58-2.23c.16-.6-.2-1.2-.8-1.37l-2.22-.6-.6-2.22c-.16-.6-.78-.95-1.37-.8l-2.23.58-1.64-1.61a1.12 1.12 0 0 0-1.58 0L9.57 2.94l-2.23-.58c-.6-.16-1.2.2-1.37.78l-.6 2.22-2.22.61c-.6.16-.95.77-.79 1.37l.58 2.23-1.61 1.64a1.12 1.12 0 0 0 0 1.58l1.61 1.63-.58 2.23c-.16.6.2 1.2.79 1.37l2.22.6.6 2.23c.16.6.78.95 1.37.8l2.23-.59 1.64 1.61a1.1 1.1 0 0 0 1.57 0l1.64-1.61 2.23.58c.6.16 1.2-.2 1.37-.8l.6-2.21 2.22-.6c.6-.16.95-.78.8-1.38l-.58-2.23 1.61-1.63c.43-.44.44-1.13.02-1.57Zm-12.2 2.12 4.8-4.8a1 1 0 1 1 1.42 1.41l-2.74 2.76-2.75 2.75-.11.1a1.03 1.03 0 0 1-1.31-.1l-2.5-2.5a1 1 0 1 1 1.4-1.41l1.8 1.79Z"
      />
    </Base>
  );
}
export function GhostVerifiedIcon(props: Props) {
  return (
    <Base width="14" height="14" fill="none" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeDasharray="2.1 2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m22.69 11.22-.02-.01-1.6-1.63.58-2.23c.16-.6-.2-1.2-.8-1.37l-2.22-.6-.6-2.22c-.16-.6-.78-.95-1.37-.8l-2.23.58-1.64-1.61a1.12 1.12 0 0 0-1.58 0L9.57 2.94l-2.23-.58c-.6-.16-1.2.2-1.37.78l-.6 2.22-2.22.61c-.6.16-.95.77-.79 1.37l.58 2.23-1.61 1.64a1.12 1.12 0 0 0 0 1.58l1.61 1.63-.58 2.23c-.16.6.2 1.2.79 1.37l2.22.6.6 2.23c.16.6.78.95 1.37.8l2.23-.59 1.64 1.61a1.1 1.1 0 0 0 1.57 0l1.64-1.61 2.23.58c.6.16 1.2-.2 1.37-.8l.6-2.21 2.22-.6c.6-.16.95-.78.8-1.38l-.58-2.23 1.61-1.63c.43-.44.44-1.13.02-1.57Z"
      />
    </Base>
  );
}
