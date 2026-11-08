import { describe, expect, it } from 'vitest';
import { BUSINESS_ICONS, iconForeground } from '../src/core/business-avatar';
import { createShareURL, loadSharedProject, sharedRoute } from '../src/core/codec';
import { normalizeProject } from '../src/core/project';
import schema from '../schemas/project-v1.schema.json';

const project = {
  version: 1,
  contact: { name: 'Empresa exemplo', verified: false },
  steps: [{ id: 'hi', type: 'business', text: 'Olá!', delay: 0 }],
};

describe('business avatar configuration', () => {
  it('publishes one distinct schema ID for each bundled icon', () => {
    expect(new Set(BUSINESS_ICONS).size).toBe(BUSINESS_ICONS.length);
    expect(schema.properties.contact.properties.icon.enum).toEqual(BUSINESS_ICONS);
  });

  it.each(BUSINESS_ICONS)('accepts the %s icon', (icon) => {
    const normalized = normalizeProject({ ...project, contact: { ...project.contact, icon } });
    expect(normalized.contact.icon ?? 'commerce').toBe(icon);
  });

  it('round-trips the chosen icon and canonical HEX through an editable preview link', async () => {
    const url = await createShareURL(
      { ...project, contact: { ...project.contact, icon: 'tooth', iconBackground: '#f0f5aa' } },
      'editor',
      'https://example.test/',
      'pt-BR',
      'preview',
    );
    const route = sharedRoute(new URL(url).hash)!;
    expect(route.previewOnly).toBe(true);
    expect((await loadSharedProject(route)).contact).toEqual({
      ...project.contact,
      icon: 'tooth',
      iconBackground: '#F0F5AA',
    });
  });

  it('uses exactly the same link for implicit and explicit defaults', async () => {
    const defaults = {
      ...project,
      contact: { ...project.contact, icon: 'commerce', iconBackground: '#21c063' },
    };
    expect(await createShareURL(defaults)).toBe(await createShareURL(project));
  });

  it('rejects unexpected icon and color values', () => {
    expect(() =>
      normalizeProject({ ...project, contact: { ...project.contact, icon: 'constructor' } }),
    ).toThrow('contact.icon');
    for (const iconBackground of ['red', '#FFF', '#12345678', '123456', '#123456\n']) {
      expect(() =>
        normalizeProject({ ...project, contact: { ...project.contact, iconBackground } }),
      ).toThrow('contact.iconBackground');
    }
  });

  it('chooses a contrasting glyph for dark and light backgrounds', () => {
    expect(iconForeground('#0C1433')).toBe('#fff');
    expect(iconForeground('#F1F5F9')).toBe('#000');
  });
});
