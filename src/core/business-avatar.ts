export const BUSINESS_ICON_GROUPS = [
  {
    id: 'segments',
    icons: [
      'finance',
      'commerce',
      'health',
      'education',
      'industry',
      'mobility',
      'travel',
      'services',
    ],
  },
  { id: 'retail', icons: ['shirt', 'utensils', 'coffee', 'shopping-cart', 'gift', 'basket'] },
  { id: 'home', icons: ['lightbulb', 'sofa', 'plant', 'house', 'key', 'hammer'] },
  { id: 'care', icons: ['tooth', 'stethoscope', 'pill', 'heart', 'dog', 'paw'] },
  { id: 'transport', icons: ['car', 'bicycle', 'boat', 'bus', 'hotel'] },
  {
    id: 'creative',
    icons: [
      'music',
      'camera',
      'headphones',
      'book',
      'gamepad',
      'laptop',
      'smartphone',
      'scissors',
      'paintbrush',
    ],
  },
] as const;

export type BusinessIcon = (typeof BUSINESS_ICON_GROUPS)[number]['icons'][number];
export const BUSINESS_ICONS = BUSINESS_ICON_GROUPS.flatMap<BusinessIcon>(({ icons }) => icons);

export const DEFAULT_BUSINESS_ICON: BusinessIcon = 'commerce';
export const DEFAULT_ICON_BACKGROUND = '#21C063';

export function isBusinessIcon(value: unknown): value is BusinessIcon {
  return BUSINESS_ICONS.some((icon) => icon === value);
}

export function isAvatarColor(value: unknown): value is string {
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
