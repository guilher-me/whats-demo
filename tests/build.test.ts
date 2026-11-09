import { expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { version } from '../package.json';
const require = createRequire(import.meta.url);
it('gera um HTML com React, estilos, foto e licenças incorporados', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'fake-flows-react-'));
  try {
    const { build } = require('../scripts/build.cjs');
    const output = join(directory, 'app.html');
    await build({ output });
    const html = readFileSync(output, 'utf8');
    expect(html).toContain('<title>WhatsDemo</title>');
    expect(html).not.toContain('APP_FAVICON');
    expect(html).toContain(
      'data:image/svg+xml;base64,' +
        readFileSync(new URL('../assets/whatsdemo-icon.svg', import.meta.url)).toString('base64'),
    );
    expect(html).toContain('data:image/png;base64,');
    const wallpaper = readFileSync(
      new URL('../assets/whatsapp-background.png', import.meta.url),
    ).toString('base64');
    expect(html.includes('data:image/png;base64,' + wallpaper)).toBe(true);
    expect(html).toContain('Copyright (c) 2026 Guilherme Cardoso');
    expect(html).toContain('Third-party notices');
    expect(html).toContain('react-dom@');
    expect(html).toContain('dom-to-image-more@');
    expect(html).toContain('fix-webm-duration@');
    expect(html).not.toContain('file-type@');
    expect(html).not.toContain('image-dimensions@');
    expect(html).not.toMatch(/<script\b[^>]*src=/i);
    expect(html).not.toContain('APP_SCRIPT');
    expect(html).not.toContain('LLM_DOCS');
    expect(html).toContain('id="llms-txt"');
    expect(html).toContain('Automation API v4');
    expect(html).not.toContain('whatsapp-fake-flows-api');
    expect(html).toContain(`<meta name="whatsdemo-version" content="${version}" />`);
    const notes = html.match(/id="release-notes">([\s\S]*?)<\/script>/)?.[1];
    expect(JSON.parse(notes!).slice(0, 2)).toMatchObject([{ version: 'Unreleased' }, { version }]);
    expect(JSON.parse(readFileSync(join(directory, 'version.json'), 'utf8'))).toEqual({ version });
    expect(readFileSync(join(directory, 'CHANGELOG.md'), 'utf8')).toBe(
      readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8'),
    );
    expect(readFileSync(join(directory, 'llms.txt'), 'utf8')).toContain(`App version: ${version}.`);
    expect(readFileSync(join(directory, 'llms.txt'), 'utf8')).toContain('window.whatsDemo');
    expect(readFileSync(join(directory, 'llm.txt'), 'utf8')).toBe(
      readFileSync(join(directory, 'llms.txt'), 'utf8'),
    );
    expect(readFileSync(join(directory, 'docs/automation.md'), 'utf8')).toContain('loadProject');
    expect(html).toContain(
      '<meta name="whatsdemo-api" content="window.whatsDemo; apiVersion=4" />',
    );
    const instructions = readFileSync(join(directory, 'llms-full.txt'), 'utf8');
    expect(instructions).toContain('(docs/messages.md#button-types-and-contexts)');
    expect(instructions).toContain('(docs/recording.md)');
    expect(instructions).toContain('(schemas/project-v1.schema.json)');
    expect(html).not.toMatch(/<link\b[^>]*stylesheet/i);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    new Script(scripts[0][1]);
    const generator = pathToFileURL(join(directory, 'share.mjs')).href;
    const generated = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      import { createShareURL } from ${JSON.stringify(generator)};
      const project = {version:1, contact:{name:"Test", verified:false},
        steps:[{id:"hello", type:"business", text:"Hello", delay:0}]};
      console.log(await createShareURL(project));
    `,
      ],
      { encoding: 'utf8' },
    );
    expect(generated.stderr).toBe('');
    expect(generated.status).toBe(0);
    expect(generated.stdout).toMatch(/https:\/\/guilher-me\.github\.io\/whats-demo\/#editor=v3z\./);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

it('rejects version drift and pending notes for a main release', () => {
  const { parseChangelog } = require('../scripts/release-notes.cjs');
  const dated = '## [1.2.3] - 2026-11-08\n\n### Fixed\n\n- Fix a button.\n';
  const pending = '## [Unreleased]\n\n### Changed\n\n- Update the preview.\n\n';
  expect(() => parseChangelog(pending + dated, '1.2.4', false)).toThrow('package version 1.2.4');
  expect(() => parseChangelog(pending + dated, '1.2.3', true)).toThrow('Move Unreleased notes');
  expect(parseChangelog('## [Unreleased]\n\n' + dated, '1.2.3', true)[1]).toMatchObject({
    version: '1.2.3',
    groups: [{ category: 'Fixed', items: ['Fix a button.'] }],
  });
});
