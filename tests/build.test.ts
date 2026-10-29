import { expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
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
    expect(html).not.toMatch(/<script\b[^>]*src=/i);
    expect(html).not.toContain('APP_SCRIPT');
    expect(html).not.toContain('LLM_DOCS');
    expect(html).toContain('id="llms-txt"');
    expect(html).toContain('Automation API v1');
    expect(readFileSync(join(directory, 'llms.txt'), 'utf8')).toContain('window.whatsappFakeFlows');
    expect(readFileSync(join(directory, 'llm.txt'), 'utf8')).toBe(
      readFileSync(join(directory, 'llms.txt'), 'utf8'),
    );
    expect(readFileSync(join(directory, 'docs/automation.md'), 'utf8')).toContain('loadProject');
    expect(html).not.toMatch(/<link\b[^>]*stylesheet/i);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    new Script(scripts[0][1]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
