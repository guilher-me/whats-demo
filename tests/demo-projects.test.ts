import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createShareURL, loadSharedProject, sharedRoute } from '../src/core/codec';
import { normalizeProject } from '../src/core/project';
import { demoProjects } from '../src/features/demos/demo-projects';
import { journeyDiagnostics } from '../src/features/flows/diagnostics';
import { locales } from '../src/i18n';

describe('sample journeys', () => {
  it.each(locales)('produces five valid shareable journeys in %s', async (locale) => {
    const demos = demoProjects(locale);
    expect(demos.map(({ project }) => project.contact)).toEqual([
      {
        name: 'Magazine Luzia',
        icon: 'sofa',
        iconBackground: '#0086FF',
        iconForeground: '#FFFFFF',
        verified: false,
      },
      {
        name: 'OdontoNext',
        icon: 'tooth',
        iconBackground: '#003EA6',
        iconForeground: '#FFFFFF',
        verified: false,
      },
      {
        name: 'iReplace',
        icon: 'smartphone',
        iconBackground: '#1C1C1E',
        iconForeground: '#FFFFFF',
        verified: false,
      },
      {
        name: 'CatLove',
        icon: 'paw',
        iconBackground: '#4E2096',
        iconForeground: '#FFFFFF',
        verified: false,
      },
      {
        name: 'NuBolso',
        icon: 'finance',
        iconBackground: '#820AD1',
        iconForeground: '#FFFFFF',
        verified: false,
      },
    ]);
    for (const { id, project } of demos) {
      expect(project.steps[0]).toMatchObject(
        id === 'catlove'
          ? { type: 'business', interactive: { kind: 'buttons', context: 'template' } }
          : { type: 'user', text: expect.stringMatching(/\S/) },
      );
      expect(journeyDiagnostics(project)).toEqual([]);
      const link = new URL(await createShareURL(project, 'demo', undefined, locale));
      const route = sharedRoute(link.hash)!;
      expect(route).toMatchObject({ mode: 'demo', locale });
      expect(await loadSharedProject(route)).toEqual(normalizeProject(project));
    }
  });

  it('links the README to the same English projects as the editor', async () => {
    const readme = readFileSync('README.md', 'utf8');
    for (const { id, project } of demoProjects('en')) {
      expect(readme).toContain(`[${project.contact.name}][${id}]`);
      const line = readme.split('\n').find((line) => line.startsWith(`[${id}]: `));
      const link = new URL(line?.slice(id.length + 4) ?? '');
      const route = sharedRoute(link.hash)!;
      expect(link.origin + link.pathname).toBe('https://guilher-me.github.io/whats-demo/');
      expect(route).toMatchObject({ mode: 'demo', locale: 'en' });
      expect(await loadSharedProject(route)).toEqual(normalizeProject(project));
    }
  });
});
