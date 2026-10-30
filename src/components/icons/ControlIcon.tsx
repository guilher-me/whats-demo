import type { SVGProps } from 'react';
const paths = {
  more: 'M12 5h.01M12 12h.01M12 19h.01',
  chevron: 'm6 9 6 6 6-6',
  copy: 'M9 9h11v12H9zM5 16H3V3h12v2',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  up: 'm5 12 7-7 7 7M12 5v15',
  down: 'm5 12 7 7 7-7M12 4v15',
  check: 'm5 12 4 4L19 6',
  photo: 'M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M15 8h.01',
  turtle:
    'M3 15h14a7 7 0 0 0-14 0ZM6 15v4m8-4v4M2 15H1m16-3h2a3 3 0 0 1 3 3v1h-5M6 9l4 3 4-3m-4 3v3',
  hare: 'M12 11c-2-3-3-8-1-9 2-1 4 5 4 8 1-4 4-7 5-6 2 1-1 6-3 8l3 2v3h-4m-4-6a6 6 0 0 0-8 5H2m2 0v3h10a4 4 0 0 0-4-4m9-2h.01',
  external: 'M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5',
  link: 'M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71',
  play: 'm9 5 11 7-11 7V5Z',
  manual:
    'M8 12V5a2 2 0 0 1 4 0v6-1a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-4-6a2 2 0 0 1 3-2l2 2',
  stop: 'M6 6h12v12H6z',
  pause: 'M7 5h3v14H7zM14 5h3v14h-3z',
  record: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
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
