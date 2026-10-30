import logo from '../../assets/luma-home.svg';
import legacyLogo from '../../assets/prevent-senior.png';

export const DEFAULT_AVATAR = logo;
export const FALLBACK_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#dce8df"/><circle cx="40" cy="29" r="13" fill="#8da798"/><path d="M14 74a26 26 0 0 1 52 0" fill="#8da798"/></svg>',
  );

/** Only exact, application-owned assets bypass the untrusted-image pipeline. */
export function trustedAvatar(value: unknown): string | undefined {
  if (!value || value === FALLBACK_AVATAR) return FALLBACK_AVATAR;
  if (value === logo || value === 'assets/luma-home.svg') return logo;
  if (value === legacyLogo || value === 'assets/prevent-senior.png') return legacyLogo;
  return undefined;
}
