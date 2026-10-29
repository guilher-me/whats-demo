import { t } from '../i18n';
import type { Project } from './types';
const MAX_BYTES = 4 * 1024 * 1024,
  MAX_HASH = 6 * 1024 * 1024;
function toBase64(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 32768)
    text += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64(text: string): Uint8Array {
  if (!text || !/^[\w-]+$/.test(text) || text.length % 4 === 1)
    throw new Error(t('errors.invalidLink'));
  return Uint8Array.from(
    atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4)),
    (c) => c.charCodeAt(0),
  );
}
async function transform(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const reader = new Blob([Uint8Array.from(bytes).buffer]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > MAX_BYTES) {
        await reader.cancel();
        throw new Error(t('errors.tooLarge'));
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
export async function encode(project: Project): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(project));
  if (bytes.length > MAX_BYTES) throw new Error(t('errors.tooLargeReduce'));
  return typeof CompressionStream === 'function'
    ? 'v1z.' + toBase64(await transform(bytes, new CompressionStream('deflate')))
    : 'v1j.' + toBase64(bytes);
}
export async function decode(hash: string): Promise<unknown> {
  const value = hash.replace(/^#?project=/, '');
  if (value.length > MAX_HASH) throw new Error(t('errors.linkTooLarge'));
  const match = /^(v1z|v1j)\.([\w-]+)$/.exec(value);
  if (!match) throw new Error(t('errors.linkVersion'));
  let bytes = fromBase64(match[2]);
  if (match[1] === 'v1z') {
    if (typeof DecompressionStream !== 'function') throw new Error(t('errors.modernBrowser'));
    try {
      bytes = await transform(bytes, new DecompressionStream('deflate'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('4 MB')) throw error;
      throw new Error(t('errors.corruptLink'));
    }
  }
  if (bytes.length > MAX_BYTES) throw new Error(t('errors.tooLarge'));
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new Error(t('errors.corruptLink'));
  }
}
export async function createURL(project: Project, href: string): Promise<string> {
  const url = new URL(href);
  url.hash = 'project=' + (await encode(project));
  return url.href;
}
