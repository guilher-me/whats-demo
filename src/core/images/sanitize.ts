import { fileTypeFromBuffer } from 'file-type';
import { trustedAvatar } from '../avatarAssets';
import type { Project } from '../types';
import {
  checkDimensions,
  ATTACHMENT_UPLOAD_LIMITS,
  IMAGE_LIMITS,
  inspectImage,
  InvalidImageError,
  readImageDataURL,
  type ImageLimits,
} from './policy';

const cache = new Map<string, string>();
const pending = new Map<string | symbol, Promise<string>>();
// Bound concurrent decoders and queued input, including calls from automation tools.
let tail: Promise<unknown> = Promise.resolve();
const MAX_PENDING = 4;
type OutputFormat = 'image/png' | 'image/webp';
const cacheKey = (source: string, format: OutputFormat) => `${format}:${source}`;
function remember(key: string, result: string) {
  cache.delete(key);
  cache.set(key, result);
  while (cache.size > 8) cache.delete(cache.keys().next().value!);
}
async function rasterize(
  bytes: Uint8Array,
  mime: string,
  format: OutputFormat,
  limits: ImageLimits = IMAGE_LIMITS,
): Promise<string> {
  inspectImage(bytes, mime, limits);
  const detected = await fileTypeFromBuffer(bytes);
  if (detected?.mime !== mime) throw new InvalidImageError('format');
  // Fail closed on browsers without this decoder. No raw source is ever attached to the DOM.
  if (typeof createImageBitmap !== 'function') throw new InvalidImageError();
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let bitmap: ImageBitmap | undefined;
  const canvas = document.createElement('canvas');
  try {
    bitmap = await Promise.race([
      createImageBitmap(new Blob([Uint8Array.from(bytes).buffer], { type: mime })).then((image) => {
        if (expired) {
          image.close();
          throw new InvalidImageError();
        }
        return image;
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new InvalidImageError());
        }, 8000);
      }),
    ]);
    checkDimensions(bitmap.width, bitmap.height, limits);
    const ratio = Math.min(1, IMAGE_LIMITS.outputEdge / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new InvalidImageError();
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // Fresh pixels only: no original metadata, scripts, trailing payload or animation is copied.
    const output =
      format === 'image/webp' ? canvas.toDataURL(format, 0.78) : canvas.toDataURL(format);
    const result = readImageDataURL(output);
    const size = inspectImage(result.bytes, result.mime);
    if (
      (result.mime !== format && result.mime !== 'image/png') ||
      Math.max(size.width, size.height) > IMAGE_LIMITS.outputEdge
    )
      throw new InvalidImageError();
    return output;
  } finally {
    clearTimeout(timer);
    bitmap?.close();
    canvas.width = canvas.height = 0;
  }
}
function enqueueImage(key: string | symbol, process: () => Promise<string>): Promise<string> {
  const existing = pending.get(key);
  if (existing) return existing;
  if (pending.size >= MAX_PENDING) return Promise.reject(new InvalidImageError());
  const work = tail.then(process);
  tail = work.catch(() => {});
  pending.set(key, work);
  void work.finally(() => pending.delete(key)).catch(() => {});
  return work;
}
function sanitizeImage(value: string, format: OutputFormat): Promise<string> {
  const key = cacheKey(value, format);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(key);
  if (existing) return existing;
  let input;
  try {
    input = readImageDataURL(value);
  } catch (error) {
    return Promise.reject(error);
  }
  return enqueueImage(key, async () => {
    const result = await rasterize(input.bytes, input.mime, format);
    remember(key, result);
    remember(cacheKey(result, format), result);
    return result;
  });
}
export function sanitizeAvatar(value: string): Promise<string> {
  return trustedAvatar(value) ? Promise.resolve(value) : sanitizeImage(value, 'image/png');
}
export function sanitizeAttachmentImage(value: string): Promise<string> {
  return sanitizeImage(value, 'image/webp');
}
async function sanitizeFile(file: File, format: OutputFormat, limits: ImageLimits = IMAGE_LIMITS) {
  // MIME and extension are not trusted; both parsers and the browser decoder check the bytes.
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new InvalidImageError('format');
  if (file.size > limits.bytes) throw new InvalidImageError('size');
  if (!file.size) throw new InvalidImageError();
  return enqueueImage(Symbol(), async () => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await rasterize(bytes, file.type, format, limits);
    remember(cacheKey(result, format), result);
    return result;
  });
}
export function sanitizePhotoFile(file: File): Promise<string> {
  return sanitizeFile(file, 'image/png');
}
export function optimizeAttachmentFile(file: File): Promise<string> {
  return sanitizeFile(file, 'image/webp', ATTACHMENT_UPLOAD_LIMITS);
}
/** A rejected photo must never discard an otherwise valid conversation. */
export async function prepareProjectImages(project: Project): Promise<Project> {
  let avatar = '';
  try {
    avatar = await sanitizeAvatar(project.contact.avatar || '');
  } catch {
    /* Use fallback. */
  }
  return { ...project, contact: { ...project.contact, avatar } };
}
