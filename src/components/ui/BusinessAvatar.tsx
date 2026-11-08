import {
  DEFAULT_BUSINESS_ICON,
  DEFAULT_ICON_BACKGROUND,
  iconForeground,
  type BusinessIcon,
} from '../../core/business-avatar';

const iconPaths: Record<Exclude<BusinessIcon, 'commerce'>, string> = {
  finance: 'M3 9h18L12 3 3 9Zm2 2v7m5-7v7m4-7v7m5-7v7M3 21h18',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z',
  education: 'm2 10 10-5 10 5-10 5L2 10Zm4 2v5c3.5 2.7 8.5 2.7 12 0v-5m4-2v6',
  industry: 'M3 21V9l6 4V9l6 4V4h4l2 17H3Zm4-4h1m3 0h1m3 0h1',
  mobility: 'M3 5h12v12H3V5Zm12 5h4l3 4v3h-2m-5 0h1m-9 0a2 2 0 1 0 4 0m5 0a2 2 0 1 0 4 0',
  travel:
    'M12 3a2 2 0 0 1 2 2v4l7 5v2l-7-2v4l2 2v1l-4-1-4 1v-1l2-2v-4l-7 2v-2l7-5V5a2 2 0 0 1 2-2Z',
  services: 'M3 7h18v13H3V7Zm6 0V4h6v3M3 12c6 3 12 3 18 0m-9 1v3',
  shirt: 'M8 4 3 6l-1 5 4 1v8h12v-8l4-1-1-5-5-2a4 4 0 0 1-8 0Z',
  utensils: 'M4 3v5a3 3 0 0 0 6 0V3M7 3v18m12 0V3c-3 1-5 5-5 10h5',
  coffee: 'M3 7h13v5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V7Zm13 1h2a3 3 0 0 1 0 6h-2M2 21h19M7 3v1m5-1v1',
  'shopping-cart': 'M2 3h3l3 12h10l3-8H6M9 20h.01m9 0h.01',
  gift: 'M3 8h18v4H3zM5 12h14v9H5zM12 8v13m0-13c-4 0-6-1-6-3a2 2 0 0 1 2-2c2 0 3 2 4 5Zm0 0c4 0 6-1 6-3a2 2 0 0 0-2-2c-2 0-3 2-4 5Z',
  basket: 'M3 9h18l-2 11H5L3 9Zm4 0 3-6m7 6-3-6M9 13v3m6-3v3',
  lightbulb: 'M9 18v-2c0-2-3-2-3-7a6 6 0 1 1 12 0c0 5-3 5-3 7v2H9Zm1 3h4',
  sofa: 'M5 11V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M5 11a2 2 0 0 0-3 2v5h20v-5a2 2 0 0 0-4 0v1H6v-1a2 2 0 0 0-1-2Zm0 7v2m14-2v2',
  plant: 'M7 15h10l-2 6H9l-2-6Zm5 0V7m0 5C7 12 5 9 5 5c4 0 7 2 7 6Zm0-3c0-4 3-6 7-6 0 4-3 7-7 7',
  house: 'm2 11 10-8 10 8m-3-2v12H5V9m5 12v-6h4v6',
  key: 'M13 9a5 5 0 1 0-4 4l8 8h4v-4l-2-2h-3v-3l-3-3Z',
  hammer: 'M4 19 14 9m-8 12L16 11M8 5l3-3 4 1 6 6-4 4-6-6-3-2Z',
  tooth:
    'M12 5c-2-2-6-3-8 0-2 3 0 7 1 10s1 6 3 6c2 0 1-7 4-7s2 7 4 7c2 0 2-3 3-6s3-7 1-10c-2-3-6-2-8 0Z',
  stethoscope:
    'M5 3H3v5a5 5 0 0 0 10 0V3h-2m-3 10v3a4 4 0 0 0 8 0v-1m4-2a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z',
  pill: 'M5 19a5 5 0 0 1 0-7l7-7a5 5 0 1 1 7 7l-7 7a5 5 0 0 1-7 0Zm4-11 7 7',
  heart: 'M12 20S3 15 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 6-9 11-9 11Z',
  dog: 'M6 7 4 4 2 11l4 2m12-6 2-3 2 7-4 2M6 8a9 9 0 0 1 12 0v7a6 6 0 0 1-12 0V8Zm3 4h.01m6 0h.01m-4 3h2l-1 2-1-2Z',
  paw: 'M8 17c1-2 2-4 4-4s3 2 4 4c2 3-1 4-4 2-3 2-6 1-4-2Zm-3-7a1.5 2 0 1 0 0-4 1.5 2 0 0 0 0 4Zm5-3a1.5 2.5 0 1 0 0-5 1.5 2.5 0 0 0 0 5Zm5 0a1.5 2.5 0 1 0 0-5 1.5 2.5 0 0 0 0 5Zm5 3a1.5 2 0 1 0 0-4 1.5 2 0 0 0 0 4Z',
  car: 'M4 10l2-5h12l2 5m-16 0h16l1 3v5H3v-5l1-3Zm2 8v2m12-2v2M6 14h2m8 0h2',
  bicycle:
    'M8 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm14 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 16l5-8 3 8H5m8 0 4-8m2 8-3-11h3M8 8h4',
  boat: 'M12 3v12M11 4 5 13h6m2-6 6 6h-6M2 15h20l-4 5H6l-4-5Z',
  bus: 'M5 18V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v12H5Zm0-7h14M8 15h.01m8 0h.01M7 18v2m10-2v2',
  hotel: 'M4 21V4h16v17H4Zm6 0v-4h4v4M8 8h1m6 0h1m-8 4h1m6 0h1',
  music:
    'M9 18V6l11-3v12M9 18c0 1.7-2 3-4 3s-3-1-3-2.5S4 16 6 16s3 1 3 2Zm11-3c0 1.7-2 3-4 3s-3-1-3-2.5 2-2.5 4-2.5 3 1 3 2Z',
  camera: 'M3 7h5l2-3h4l2 3h5v13H3V7Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  headphones:
    'M3 13v-1a9 9 0 1 1 18 0v1M3 13h4v7H5a2 2 0 0 1-2-2v-5Zm18 0h-4v7h2a2 2 0 0 0 2-2v-5Z',
  book: 'M12 6c-3-2-6-3-10-2v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-4-1-7 0-10 2Zm0 0v15',
  gamepad:
    'M7 8h10c2 0 4 2 4 4l1 4c.5 2-1.5 3-3 2l-3-2H8l-3 2c-1.5 1-3.5 0-3-2l1-4c0-2 2-4 4-4Zm0 3v4m-2-2h4m6-1h.01m3 2h.01',
  laptop: 'M5 16V5h14v11M5 16l-3 4h20l-3-4H5Z',
  smartphone:
    'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 3h4m-2 14h.01',
  scissors:
    'M9 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-1-8 12 11M8 15 20 4',
  paintbrush: 'm9 15 10-12a2 2 0 1 1 3 3L12 17m-3-2c-3-1-5 1-5 3 0 1-1 2-2 3 5 1 9-1 10-4l-3-2Z',
};

// Store glyph from the original WhatsApp avatar supplied for the demo.
const storePath =
  'M26.0704 15.963C26.5687 15.963 27.0139 16.2747 27.1842 16.7431L28.6926 20.8913C28.9163 21.5064 28.599 22.1864 27.9838 22.4101C27.854 22.4573 27.7169 22.4815 27.5788 22.4815H27.4931V26.9259C27.4931 27.4168 27.0951 27.8148 26.6042 27.8148C26.1133 27.8148 25.7153 27.4168 25.7153 26.9259V22.4815H22.1598V26.6296C22.1598 27.2842 21.6291 27.8148 20.9746 27.8148H14.4561C13.8015 27.8148 13.2709 27.2842 13.2709 26.6296V22.4815H13.1852C12.5306 22.4815 12 21.9509 12 21.2963C12 21.1582 12.0241 21.0211 12.0713 20.8913L13.5798 16.7431C13.7501 16.2747 14.1952 15.963 14.6936 15.963H26.0704ZM20.382 22.4815H15.0487V26.037H20.382V22.4815ZM26.0116 13C26.5025 13 26.9005 13.398 26.9005 13.8889C26.9005 14.3798 26.5025 14.7778 26.0116 14.7778H14.7524C14.2614 14.7778 13.8635 14.3798 13.8635 13.8889C13.8635 13.398 14.2614 13 14.7524 13H26.0116Z';

export function BusinessAvatar({
  icon = DEFAULT_BUSINESS_ICON,
  iconBackground = DEFAULT_ICON_BACKGROUND,
  iconForeground: foregroundOverride,
}: {
  icon?: BusinessIcon;
  iconBackground?: string;
  iconForeground?: string;
}) {
  const background = iconBackground.toUpperCase();
  const foreground =
    foregroundOverride ??
    (background === DEFAULT_ICON_BACKGROUND ? '#fff' : iconForeground(background));
  return (
    <svg
      className="avatar"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="20" cy="20" r="20" fill={background} />
      {icon === 'commerce' ? (
        <path d={storePath} fill={foreground} fillRule="evenodd" />
      ) : (
        <path
          d={iconPaths[icon]}
          transform="translate(9 9) scale(0.9167)"
          fill="none"
          stroke={foreground}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
