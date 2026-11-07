import { currentLocale, isLocale, t, type Locale } from '../i18n';
import { normalizeProject } from './project';
import { recoverProject } from './legacy-project';

export type ShareMode = 'demo' | 'editor';
export const MAX_LINK_LENGTH = 8000;
export const MAX_SHARE_BYTES = 128 * 1024;
const LEGACY_MAX_BYTES = 4 * 1024 * 1024;
const LEGACY_MAX_HASH = 6 * 1024 * 1024;

class SizeLimitError extends Error {}

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE62_BLOCK_BYTES = 32;
const BASE62_BLOCK_CHARS = 43;
const BASE62_BITS_PER_CHAR = Math.log2(BASE62.length);

function base62Width(bytes: number): number {
  return Math.ceil((bytes * 8) / BASE62_BITS_PER_CHAR);
}

// Fixed-width blocks preserve leading zero bytes and bound the size of each BigInt.
function toBase62(bytes: Uint8Array): string {
  const blocks: string[] = [];
  for (let start = 0; start < bytes.length; start += BASE62_BLOCK_BYTES) {
    const block = bytes.subarray(start, start + BASE62_BLOCK_BYTES);
    let value = 0n;
    for (const byte of block) value = (value << 8n) | BigInt(byte);

    let digits = '';
    while (value > 0n) {
      digits = BASE62[Number(value % 62n)] + digits;
      value /= 62n;
    }
    blocks.push(digits.padStart(base62Width(block.length), BASE62[0]));
  }
  return blocks.join('');
}

function fromBase62(text: string): Uint8Array {
  const tailChars = text.length % BASE62_BLOCK_CHARS;
  const tailBytes = Math.floor((tailChars * BASE62_BITS_PER_CHAR) / 8);
  if (tailChars !== base62Width(tailBytes)) throw new Error(t('errors.invalidLink'));

  const fullBlocks = Math.floor(text.length / BASE62_BLOCK_CHARS);
  const bytes = new Uint8Array(fullBlocks * BASE62_BLOCK_BYTES + tailBytes);
  for (
    let start = 0, offset = 0;
    start < text.length;
    start += BASE62_BLOCK_CHARS, offset += BASE62_BLOCK_BYTES
  ) {
    let value = 0n;
    for (const char of text.slice(start, start + BASE62_BLOCK_CHARS)) {
      const digit = BASE62.indexOf(char);
      if (digit < 0) throw new Error(t('errors.invalidLink'));
      value = value * 62n + BigInt(digit);
    }
    const end = Math.min(offset + BASE62_BLOCK_BYTES, bytes.length);
    for (let index = end - 1; index >= offset; index--) {
      bytes[index] = Number(value & 255n);
      value >>= 8n;
    }
    if (value !== 0n) throw new Error(t('errors.invalidLink'));
  }
  return bytes;
}

function fromBase64(text: string): Uint8Array {
  if (!text || !/^[\w-]+$/.test(text) || text.length % 4 === 1)
    throw new Error(t('errors.invalidLink'));
  return Uint8Array.from(
    atob(
      text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - ((text.length % 4) % 4)) % 4),
    ),
    (character) => character.charCodeAt(0),
  );
}

async function transform(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
  limit: number,
): Promise<Uint8Array> {
  const reader = new Blob([Uint8Array.from(bytes).buffer]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) {
        await reader.cancel();
        throw new SizeLimitError(t('sharing.dataTooLarge', { max: limit / 1024 }));
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

export async function encode(input: unknown): Promise<string> {
  const project = normalizeProject(input, { strictIds: true });
  if (!project.steps.length) throw new Error(t('sharing.empty'));
  const bytes = new TextEncoder().encode(JSON.stringify(project));
  if (bytes.length > MAX_SHARE_BYTES)
    throw new SizeLimitError(t('sharing.dataTooLarge', { max: MAX_SHARE_BYTES / 1024 }));
  if (typeof CompressionStream !== 'function') throw new Error(t('errors.modernBrowser'));
  return (
    'v3z.' +
    toBase62(await transform(bytes, new CompressionStream('deflate'), MAX_SHARE_BYTES + 1024))
  );
}

export async function decode(hash: string): Promise<unknown> {
  const value = sharedRoute(hash.startsWith('#') ? hash : '#' + hash)?.token ?? hash;
  if (value.length > LEGACY_MAX_HASH) throw new Error(t('errors.linkTooLarge'));
  const match = /^(v1z|v1j|v2z|v3z)\.([\w-]+)$/.exec(value);
  if (!match) throw new Error(t('errors.linkVersion'));
  const version = match[1];
  const modern = version === 'v2z' || version === 'v3z';
  if (modern && value.length > MAX_LINK_LENGTH) throw new Error(t('errors.linkTooLarge'));
  const limit = modern ? MAX_SHARE_BYTES : LEGACY_MAX_BYTES;
  let bytes = version === 'v3z' ? fromBase62(match[2]) : fromBase64(match[2]);
  if (version !== 'v1j') {
    if (typeof DecompressionStream !== 'function') throw new Error(t('errors.modernBrowser'));
    try {
      bytes = await transform(bytes, new DecompressionStream('deflate'), limit);
    } catch (error) {
      if (error instanceof SizeLimitError) throw error;
      throw new Error(t('errors.corruptLink'));
    }
  }
  if (bytes.length > limit) throw new Error(t('sharing.dataTooLarge', { max: limit / 1024 }));
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new Error(t('errors.corruptLink'));
  }
}

export function shareBase(href: string) {
  const url = new URL(href);
  if (url.protocol === 'file:') return new URL('https://guilher-me.github.io/whats-demo/');
  if (url.protocol !== 'https:' && url.protocol !== 'http:')
    throw new Error(t('errors.invalidLink'));
  url.username = '';
  url.password = '';
  url.search = '';
  url.hash = '';
  return url;
}

export async function createShareURL(
  input: unknown,
  mode: ShareMode = 'editor',
  href = 'https://guilher-me.github.io/whats-demo/',
  locale: Locale = currentLocale(),
  view?: 'preview',
): Promise<string> {
  if (mode !== 'demo' && mode !== 'editor') throw new Error(t('errors.mode'));
  const url = shareBase(href);
  const hash = shareHash(mode, await encode(input), locale);
  url.hash = mode === 'editor' && view === 'preview' ? hash + '&view=preview' : hash;
  if (url.href.length > MAX_LINK_LENGTH)
    throw new Error(t('sharing.linkLength', { length: url.href.length, max: MAX_LINK_LENGTH }));
  return url.href;
}

export function shareHash(mode: ShareMode, token: string, locale?: Locale) {
  return '#' + mode + '=' + token + (locale ? '&lang=' + locale : '');
}

export function sharedRoute(hash: string) {
  const match = /^#(demo|editor|project)(?:=|$)/.exec(hash);
  if (!match) return undefined;
  const legacy = match[1] === 'project';
  const [token, ...parameters] = hash.slice(match[0].length).split('&');
  const settings = new URLSearchParams(parameters.join('&'));
  const locale = settings.get('lang');
  return {
    mode: (legacy ? 'demo' : match[1]) as ShareMode,
    legacy,
    token,
    locale: isLocale(locale) ? locale : undefined,
    previewOnly: match[1] === 'editor' && settings.get('view') === 'preview',
  };
}

export async function loadSharedProject(
  route: Pick<NonNullable<ReturnType<typeof sharedRoute>>, 'legacy' | 'token'>,
) {
  if (!(route.legacy ? /^v1[zj]\./ : /^v[23]z\./).test(route.token))
    throw new Error(t('errors.linkVersion'));
  const input = await decode(route.token);
  const project = route.legacy
    ? recoverProject(input)
    : normalizeProject(input, { strictIds: true });
  if (!project.steps.length) throw new Error(t('sharing.empty'));
  return project;
}
