import { t } from '../i18n';
import { normalizeProject } from './project';
import { recoverProject } from './legacy-project';

export type ShareMode = 'demo' | 'editor';
export const MAX_LINK_LENGTH = 8000;
export const MAX_SHARE_BYTES = 128 * 1024;
const LEGACY_MAX_BYTES = 4 * 1024 * 1024;
const LEGACY_MAX_HASH = 6 * 1024 * 1024;

class SizeLimitError extends Error {}

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
    'v2z.' +
    toBase64(await transform(bytes, new CompressionStream('deflate'), MAX_SHARE_BYTES + 1024))
  );
}

export async function decode(hash: string): Promise<unknown> {
  const value = hash.replace(/^#?(?:project|demo|editor)=/, '');
  if (value.length > LEGACY_MAX_HASH) throw new Error(t('errors.linkTooLarge'));
  const match = /^(v1z|v1j|v2z)\.([\w-]+)$/.exec(value);
  if (!match) throw new Error(t('errors.linkVersion'));
  const version = match[1];
  const modern = version === 'v2z';
  if (modern && value.length > MAX_LINK_LENGTH) throw new Error(t('errors.linkTooLarge'));
  const limit = modern ? MAX_SHARE_BYTES : LEGACY_MAX_BYTES;
  let bytes = fromBase64(match[2]);
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
  mode: ShareMode = 'demo',
  href = 'https://guilher-me.github.io/whats-demo/',
): Promise<string> {
  if (mode !== 'demo' && mode !== 'editor') throw new Error(t('errors.mode'));
  const url = shareBase(href);
  url.hash = mode + '=' + (await encode(input));
  if (url.href.length > MAX_LINK_LENGTH)
    throw new Error(t('sharing.linkLength', { length: url.href.length, max: MAX_LINK_LENGTH }));
  return url.href;
}

export function sharedRoute(hash: string) {
  const match = /^#(demo|editor|project)(?:=|$)/.exec(hash);
  if (!match) return undefined;
  const legacy = match[1] === 'project';
  return {
    mode: (legacy ? 'demo' : match[1]) as ShareMode,
    legacy,
    token: hash.slice(match[0].length),
  };
}

export async function loadSharedProject(route: NonNullable<ReturnType<typeof sharedRoute>>) {
  if (!route.token.startsWith(route.legacy ? 'v1' : 'v2z.'))
    throw new Error(t('errors.linkVersion'));
  const input = await decode(route.token);
  const project = route.legacy
    ? recoverProject(input)
    : normalizeProject(input, { strictIds: true });
  if (!project.steps.length) throw new Error(t('sharing.empty'));
  return project;
}
