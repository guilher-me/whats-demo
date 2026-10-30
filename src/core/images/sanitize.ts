import { fileTypeFromBuffer } from 'file-type';
import { trustedAvatar } from '../avatarAssets';
import type { Project } from '../types';
import {
  checkDimensions,
  IMAGE_LIMITS,
  inspectImage,
  InvalidImageError,
  readImageDataURL,
} from './policy';

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
// Bound concurrent decoders and queued input, including calls from automation tools.
let tail: Promise<unknown> = Promise.resolve();
const MAX_PENDING = 4;
function remember(key: string, result: string) {
  cache.delete(key);
  cache.set(key, result);
  while (cache.size > 8) cache.delete(cache.keys().next().value!);
}
function dataURL(bytes: Uint8Array, mime: string) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 32768)
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return `data:${mime};base64,${btoa(binary)}`;
}
async function rasterize(bytes: Uint8Array, mime: string): Promise<string> {
  inspectImage(bytes, mime);
  const detected = await fileTypeFromBuffer(bytes);
  if (detected?.mime !== mime) throw new InvalidImageError();
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
    checkDimensions(bitmap.width, bitmap.height);
    const ratio = Math.min(1, IMAGE_LIMITS.outputEdge / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new InvalidImageError();
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // Fresh pixels only: no original metadata, scripts, trailing payload or animation is copied.
    const output = canvas.toDataURL('image/png');
    const result = readImageDataURL(output);
    const size = inspectImage(result.bytes, result.mime);
    if (result.mime !== 'image/png' || Math.max(size.width, size.height) > IMAGE_LIMITS.outputEdge)
      throw new InvalidImageError();
    return output;
  } finally {
    clearTimeout(timer);
    bitmap?.close();
    canvas.width = canvas.height = 0;
  }
}
export function sanitizeAvatar(value: string): Promise<string> {
  if (trustedAvatar(value)) return Promise.resolve(value);
  const cached = cache.get(value);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(value);
  if (existing) return existing;
  if (pending.size >= MAX_PENDING) return Promise.reject(new InvalidImageError());
  // Validate synchronously before retaining untrusted input in the queue.
  try {
    readImageDataURL(value);
  } catch (error) {
    return Promise.reject(error);
  }
  const work = tail.then(async () => {
    const { bytes, mime } = readImageDataURL(value);
    const result = await rasterize(bytes, mime);
    remember(value, result);
    remember(result, result);
    return result;
  });
  tail = work.catch(() => {});
  pending.set(value, work);
  void work.finally(() => pending.delete(value)).catch(() => {});
  return work;
}
export async function sanitizePhotoFile(file: File): Promise<string> {
  // MIME and extension are not trusted; both parsers and the browser decoder check the bytes.
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    !file.size ||
    file.size > IMAGE_LIMITS.bytes
  )
    throw new InvalidImageError();
  const bytes = new Uint8Array(await file.arrayBuffer());
  inspectImage(bytes, file.type);
  return sanitizeAvatar(dataURL(bytes, file.type));
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
