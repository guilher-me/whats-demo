export const BUSINESS_ICONS = [
  'finance',
  'commerce',
  'health',
  'education',
  'industry',
  'mobility',
  'travel',
  'services',
] as const;

export type BusinessIcon = (typeof BUSINESS_ICONS)[number];
export const DEFAULT_BUSINESS_ICON: BusinessIcon = 'commerce';
export const DEFAULT_ICON_BACKGROUND = '#21C063';

export function isBusinessIcon(value: unknown): value is BusinessIcon {
  return BUSINESS_ICONS.some((icon) => icon === value);
}

export function isIconBackground(value: unknown): value is string {
  return typeof value === 'string' && value.length === 7 && /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function iconForeground(background: string): '#000' | '#fff' {
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(background.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000' : '#fff';
}
