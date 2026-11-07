import { imageDimensionsFromData } from 'image-dimensions';
import { trustedAvatar } from '../avatarAssets';

export const IMAGE_LIMITS = Object.freeze({
  bytes: 2 * 1024 * 1024,
  edge: 4096,
  pixels: 8_000_000,
  outputEdge: 512,
});
export const ATTACHMENT_UPLOAD_LIMITS = Object.freeze({
  bytes: 12 * 1024 * 1024,
  edge: 8192,
  pixels: 32_000_000,
});
export type ImageLimits = Readonly<{ bytes: number; edge: number; pixels: number }>;
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
const types: Record<string, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
export class InvalidImageError extends Error {
  constructor(
    readonly reason: 'decode' | 'format' | 'size' | 'dimensions' = 'decode',
    readonly dimensions?: { width: number; height: number },
  ) {
    super('Invalid or unsupported image');
  }
}
export function checkDimensions(width: number, height: number, limits: ImageLimits = IMAGE_LIMITS) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1)
    throw new InvalidImageError();
  if (width > limits.edge || height > limits.edge || width * height > limits.pixels)
    throw new InvalidImageError('dimensions', { width, height });
}
/** Header checks bound decoding work; they do not establish that the image is safe to render. */
export function inspectImage(bytes: Uint8Array, mime: string, limits: ImageLimits = IMAGE_LIMITS) {
  if (!Object.values(types).includes(mime)) throw new InvalidImageError('format');
  if (bytes.length > limits.bytes) throw new InvalidImageError('size');
  let dimensions;
  try {
    dimensions = imageDimensionsFromData(bytes);
  } catch {
    throw new InvalidImageError();
  }
  if (!dimensions || types[dimensions.type] !== mime) throw new InvalidImageError('format');
  checkDimensions(dimensions.width, dimensions.height, limits);
  return dimensions;
}
export function readImageDataURL(value: unknown): { bytes: Uint8Array; mime: string } {
  if (typeof value !== 'string' || value.length > 4 * Math.ceil(IMAGE_LIMITS.bytes / 3) + 32)
    throw new InvalidImageError();
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) throw new InvalidImageError();
  let binary: string;
  try {
    binary = atob(match[2]);
    if (btoa(binary) !== match[2]) throw new InvalidImageError();
  } catch {
    throw new InvalidImageError();
  }
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  inspectImage(bytes, match[1]);
  return { bytes, mime: match[1] };
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
