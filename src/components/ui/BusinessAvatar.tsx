import {
  DEFAULT_BUSINESS_ICON,
  DEFAULT_ICON_BACKGROUND,
  iconForeground,
  type BusinessIcon,
} from '../../core/business-avatar';

const segmentPaths: Record<Exclude<BusinessIcon, 'commerce'>, string> = {
  finance: 'M3 9h18L12 3 3 9Zm2 2v7m5-7v7m4-7v7m5-7v7M3 21h18',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z',
  education: 'm2 10 10-5 10 5-10 5L2 10Zm4 2v5c3.5 2.7 8.5 2.7 12 0v-5m4-2v6',
  industry: 'M3 21V9l6 4V9l6 4V4h4l2 17H3Zm4-4h1m3 0h1m3 0h1',
  mobility: 'M3 5h12v12H3V5Zm12 5h4l3 4v3h-2m-5 0h1m-9 0a2 2 0 1 0 4 0m5 0a2 2 0 1 0 4 0',
  travel:
    'M12 3a2 2 0 0 1 2 2v4l7 5v2l-7-2v4l2 2v1l-4-1-4 1v-1l2-2v-4l-7 2v-2l7-5V5a2 2 0 0 1 2-2Z',
  services: 'M3 7h18v13H3V7Zm6 0V4h6v3M3 12c6 3 12 3 18 0m-9 1v3',
};

// Store glyph from the original WhatsApp avatar supplied for the demo.
const storePath =
  'M26.0704 15.963C26.5687 15.963 27.0139 16.2747 27.1842 16.7431L28.6926 20.8913C28.9163 21.5064 28.599 22.1864 27.9838 22.4101C27.854 22.4573 27.7169 22.4815 27.5788 22.4815H27.4931V26.9259C27.4931 27.4168 27.0951 27.8148 26.6042 27.8148C26.1133 27.8148 25.7153 27.4168 25.7153 26.9259V22.4815H22.1598V26.6296C22.1598 27.2842 21.6291 27.8148 20.9746 27.8148H14.4561C13.8015 27.8148 13.2709 27.2842 13.2709 26.6296V22.4815H13.1852C12.5306 22.4815 12 21.9509 12 21.2963C12 21.1582 12.0241 21.0211 12.0713 20.8913L13.5798 16.7431C13.7501 16.2747 14.1952 15.963 14.6936 15.963H26.0704ZM20.382 22.4815H15.0487V26.037H20.382V22.4815ZM26.0116 13C26.5025 13 26.9005 13.398 26.9005 13.8889C26.9005 14.3798 26.5025 14.7778 26.0116 14.7778H14.7524C14.2614 14.7778 13.8635 14.3798 13.8635 13.8889C13.8635 13.398 14.2614 13 14.7524 13H26.0116Z';

export function BusinessAvatar({
  icon = DEFAULT_BUSINESS_ICON,
  iconBackground = DEFAULT_ICON_BACKGROUND,
}: {
  icon?: BusinessIcon;
  iconBackground?: string;
}) {
  const background = iconBackground.toUpperCase();
  const stockStore = icon === DEFAULT_BUSINESS_ICON && background === DEFAULT_ICON_BACKGROUND;
  const foreground = stockStore ? '#fff' : iconForeground(background);
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
          d={segmentPaths[icon]}
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
