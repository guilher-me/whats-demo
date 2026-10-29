import type { SVGProps } from 'react';
const paths = {
  play: 'm9 5 11 7-11 7V5Z',
  manual:
    'M8 12V5a2 2 0 0 1 4 0v6-1a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-4-6a2 2 0 0 1 3-2l2 2',
  stop: 'M6 6h12v12H6z',
  pause: 'M7 5h3v14H7zM14 5h3v14h-3z',
  reset: 'M3 10a9 9 0 1 1 2 9M3 4v6h6',
  user: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  message: 'M21 11a9 9 0 0 1-9 9H3l2-5A9 9 0 1 1 21 11ZM8 9h8M8 13h5',
  flow: 'M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3M8 2h8v5H8zM7 12h10M7 16h6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
} as const;
export function ControlIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
