const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { build, localFile } = require('../scripts/build.cjs');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-flows-build-'));
const output = path.join(directory, 'standalone.html');
try {
  const result = build({ output });
  const html = fs.readFileSync(output, 'utf8');
  assert(result.bytes > 1000);
  assert(!/<script\b[^>]*\bsrc\s*=/i.test(html));
  assert(!/<link\b[^>]*\brel="stylesheet"/i.test(html));
  assert(html.includes('data:image/png;base64,'));
  assert(html.includes('id="share"'));
  assert(html.includes('flow-option > input[type="radio"]'));
  assert(html.includes('wds-ic-verified-filled'));
  assert(html.includes('function apply(contact)'));
  for (const [index, match] of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].entries()) {
    new vm.Script(match[1], { filename: 'bundle-script-' + index });
  }
  const sandbox = { window: {} };
  const defaults = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m => m[1].includes('// Source: src/defaults.js'));
  vm.runInNewContext(defaults[1], sandbox);
  assert(sandbox.window.FakeFlowsDefault().contact.avatar.startsWith('data:image/png;base64,'));
  assert.throws(() => localFile(directory, '../outside.js'), /dentro/);
  console.log('OK: standalone HTML, embedded profile, inline scripts syntax, existing controls and SVG, source path isolation.');
} finally {
  if (fs.existsSync(output)) fs.unlinkSync(output);
  fs.rmdirSync(directory);
}
