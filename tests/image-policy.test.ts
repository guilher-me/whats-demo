import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isAllowedAvatar, readImageDataURL, IMAGE_LIMITS } from '../src/core/images/policy';
import { prepareProjectImages } from '../src/core/images/sanitize';
import { normalizeProject } from '../src/core/project';
import { createURL, decode } from '../src/core/codec';
import legacy from './fixtures/v1-project.json';

export const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
describe('untrusted contact images', () => {
  it('accepts valid raster headers and exact legacy asset aliases', () => {
    expect(readImageDataURL(PNG).mime).toBe('image/png');
    expect(isAllowedAvatar('assets/prevent-senior.png')).toBe(true);
    expect(isAllowedAvatar('assets/luma-home.svg')).toBe(true);
    const logo = readFileSync(new URL('../assets/prevent-senior.png', import.meta.url));
    expect(isAllowedAvatar('data:image/png;base64,' + logo.toString('base64'))).toBe(true);
  });
  it.each([
    'data:image/svg+xml;base64,' + btoa('<svg onload="alert(1)"/>'),
    'data:image/png;base64,' + btoa('<svg onload="alert(1)"/>'),
    'data:text/html;base64,' + btoa('<script>alert(1)</script>'),
    'data:image/png;base64,AA==',
    PNG.replace('image/png', 'image/jpeg'),
    PNG.replace(';base64', ';charset=utf-8;base64'),
    PNG + '\n',
    'https://attacker.test/track.png',
    'javascript:alert(1)',
    'assets/../malicious.svg',
    'assets/other.png',
    42,
  ])('strips unsafe photo %s without losing the journey', (avatar) => {
    expect(isAllowedAvatar(avatar)).toBe(false);
    const result = normalizeProject({ ...legacy, contact: { ...legacy.contact, avatar } });
    expect(result.contact.avatar).toBe('');
    expect(result.steps).toEqual(legacy.steps);
  });
  it('rejects excessive bytes, edges and pixel counts before decoding', () => {
    expect(isAllowedAvatar('data:image/png;base64,' + 'A'.repeat(IMAGE_LIMITS.bytes * 2))).toBe(
      false,
    );
    for (const [width, height] of [
      [4097, 1],
      [3000, 3000],
      [0, 1],
    ]) {
      const bytes = Buffer.from(PNG.split(',')[1], 'base64');
      bytes.writeUInt32BE(width, 16);
      bytes.writeUInt32BE(height, 20);
      expect(isAllowedAvatar('data:image/png;base64,' + bytes.toString('base64'))).toBe(false);
    }
  });
  it('removes undecodable images when creating links, leaving project content intact', async () => {
    const project = normalizeProject(legacy);
    project.contact.avatar = PNG; // Node has no browser decoder: fail closed.
    const safe = await prepareProjectImages(project);
    expect(safe.contact.avatar).toBe('');
    expect(project.contact.avatar).toBe(PNG);
    expect(safe.steps).toEqual(project.steps);
    const url = await createURL(project, 'https://example.test/');
    expect(((await decode(new URL(url).hash)) as typeof project).contact.avatar).toBe('');
  });
});
