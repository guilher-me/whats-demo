import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import {
  createShareURL,
  decode,
  loadSharedProject,
  MAX_SHARE_BYTES,
  sharedRoute,
} from '../src/core/codec';
import { normalizeProject } from '../src/core/project';
import legacy from './fixtures/v1-project.json';

describe('share link compatibility', () => {
  it('opens existing v1 compressed and uncompressed links with the fixed store icon', async () => {
    const compressed = readFileSync(
      new URL('./fixtures/v1-link.txt', import.meta.url),
      'utf8',
    ).trim();
    const raw = 'v1j.' + Buffer.from(JSON.stringify(legacy)).toString('base64url');
    for (const token of [compressed, raw]) {
      expect(await decode(token)).toEqual(legacy);
      const route = sharedRoute('#project=' + token)!;
      expect(route.mode).toBe('demo');
      expect(await loadSharedProject(route)).toEqual(normalizeProject(legacy));
      expect((await loadSharedProject(route)).contact).not.toHaveProperty('avatar');
    }
  });

  it('opens intact v2z links in both modes', async () => {
    const project = normalizeProject(legacy);
    const token = 'v2z.' + deflateSync(JSON.stringify(project)).toString('base64url');
    expect(token).toContain('_');
    for (const mode of ['demo', 'editor']) {
      const route = sharedRoute(`#${mode}=${token}&lang=es`)!;
      expect(route).toMatchObject({ mode, locale: 'es' });
      expect(await loadSharedProject(route)).toEqual(project);
    }
  });

  it('uses one compressed payload for both modes and keeps the environment path', async () => {
    const project = normalizeProject(legacy);
    project.contact.name = 'Clínica São João 🩺';
    const base = 'https://example.com/app/development/?unused=yes#old';
    const demo = new URL(await createShareURL(project, 'demo', base));
    const editor = new URL(await createShareURL(project, 'editor', base));
    expect(demo.pathname).toBe('/app/development/');
    expect(demo.search).toBe('');
    expect(demo.hash).toMatch(/^#demo=v3z\.[A-Za-z0-9]+&lang=pt-BR$/);
    expect(await createShareURL(project, undefined, base)).toBe(editor.href);
    expect(sharedRoute(editor.hash)?.locale).toBe('pt-BR');
    expect(editor.hash).toBe(demo.hash.replace('#demo=', '#editor='));
    expect(await loadSharedProject(sharedRoute(demo.hash)!)).toEqual(project);
  });

  it('rejects invalid versions, broken compressed data and excessive links and inflation', async () => {
    await expect(decode('v99.no')).rejects.toThrow('versão');
    await expect(decode('v2z.broken')).rejects.toThrow('corrompido');
    await expect(decode('v3z.' + 'a'.repeat(8001))).rejects.toThrow();
    for (const malformed of ['0', 'zz', '0_']) {
      await expect(decode('v3z.' + malformed)).rejects.toThrow('inválido');
    }
    const project = normalizeProject(legacy);
    project.steps[0].text = randomBytes(8000).toString('hex');
    await expect(createShareURL(project)).rejects.toThrow('8000');
    project.steps[0].text = 'x'.repeat(MAX_SHARE_BYTES);
    await expect(createShareURL(project)).rejects.toThrow('128 KiB');
    const bomb = 'v2z.' + deflateSync('x'.repeat(MAX_SHARE_BYTES + 1)).toString('base64url');
    await expect(decode(bomb)).rejects.toThrow('128 KiB');
  });
});
