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
    expect(html).toContain('data:image/png;base64,');
    expect(html).toContain('Copyright (c) 2026 Guilherme Cardoso');
    expect(html).toContain('Third-party notices');
    expect(html).toContain('react-dom@');
    expect(html).not.toMatch(/<script\b[^>]*src=/i);
    expect(html).not.toContain('APP_SCRIPT');
    expect(html).not.toMatch(/<link\b[^>]*stylesheet/i);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    new Script(scripts[0][1]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
