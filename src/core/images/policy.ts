import { imageDimensionsFromData } from 'image-dimensions';
import { trustedAvatar } from '../avatarAssets';

export const IMAGE_LIMITS = Object.freeze({
  bytes: 2 * 1024 * 1024,
  edge: 4096,
  pixels: 8_000_000,
  outputEdge: 512,
});
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
const types: Record<string, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
export class InvalidImageError extends Error {
  constructor() {
    super('Invalid or unsupported contact image');
  }
}
export function checkDimensions(width: number, height: number) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > IMAGE_LIMITS.edge ||
    height > IMAGE_LIMITS.edge ||
    width * height > IMAGE_LIMITS.pixels
  )
    throw new InvalidImageError();
}
/** Header checks bound decoding work; they do not establish that the image is safe to render. */
export function inspectImage(bytes: Uint8Array, mime: string) {
  if (!Object.values(types).includes(mime) || !bytes.length || bytes.length > IMAGE_LIMITS.bytes)
    throw new InvalidImageError();
  try {
    const dimensions = imageDimensionsFromData(bytes);
    if (!dimensions || types[dimensions.type] !== mime) throw new InvalidImageError();
    checkDimensions(dimensions.width, dimensions.height);
    return dimensions;
  } catch {
    throw new InvalidImageError();
  }
}
export function readImageDataURL(value: unknown): { bytes: Uint8Array; mime: string } {
  if (typeof value !== 'string' || value.length > 4 * Math.ceil(IMAGE_LIMITS.bytes / 3) + 32)
    throw new InvalidImageError();
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) throw new InvalidImageError();
  try {
    const binary = atob(match[2]);
    if (btoa(binary) !== match[2]) throw new InvalidImageError();
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    inspectImage(bytes, match[1]);
    return { bytes, mime: match[1] };
  } catch {
    throw new InvalidImageError();
  }
}
export function isAllowedAvatar(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (trustedAvatar(value)) return true;
  try {
    readImageDataURL(value);
    return true;
  } catch {
    return false;
  }
}
