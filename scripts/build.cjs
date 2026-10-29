const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const { agentDocs } = require('./agent-docs.cjs');
const { brandHtml } = require('./branding.cjs');
const ROOT = path.resolve(__dirname, '..');
function dependencyNotices(root, inputs) {
  const packages = new Set();
  for (const input of Object.keys(inputs)) {
    if (!input.includes('node_modules')) continue;
    let directory = path.dirname(path.resolve(root, input));
    while (directory.includes('node_modules')) {
      if (fs.existsSync(path.join(directory, 'package.json'))) {
        packages.add(directory);
        break;
      }
      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
  return [...packages]
    .sort()
    .map((directory) => {
      const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
      const filename = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md'].find(
        (name) => fs.existsSync(path.join(directory, name)),
      );
      return `\n${pkg.name}@${pkg.version}\n${filename ? fs.readFileSync(path.join(directory, filename), 'utf8') : 'License: ' + pkg.license}\n`;
    })
    .join('\n');
}
async function build({
  root = ROOT,
  output = path.join(root, 'dist', 'whatsapp-fake-flows.html'),
} = {}) {
  const result = await esbuild.build({
    absWorkingDir: root,
    entryPoints: ['src/main.tsx'],
    bundle: true,
    write: false,
    outdir: path.join(root, '.build'),
    entryNames: 'app',
    platform: 'browser',
    format: 'iife',
    target: 'es2022',
    jsx: 'automatic',
    minify: true,
    legalComments: 'inline',
    loader: { '.png': 'dataurl', '.svg': 'dataurl' },
    metafile: true,
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const js = result.outputFiles.find((file) => file.path.endsWith('.js'))?.text,
    css = result.outputFiles.find((file) => file.path.endsWith('.css'))?.text;
  if (!js || !css) throw new Error('O build precisa gerar JavaScript e CSS.');
  const notices =
    fs.readFileSync(path.join(root, 'LICENSE'), 'utf8') +
    '\nThird-party notices\n' +
    dependencyNotices(root, result.metafile.inputs);
  let html = agentDocs(
    root,
    path.dirname(output),
    brandHtml(root, fs.readFileSync(path.join(root, 'index.html'), 'utf8')),
  );
  html = html.replace(
    '<!-- APP_STYLES -->',
    () => '<style>\n' + css.replace(/<\/style/gi, '<\\/style') + '\n</style>',
  );
  html = html.replace(
    '<!-- APP_SCRIPT -->',
    () => '<script>\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>',
  );
  html = html.replace(
    /<!doctype html>/i,
    (match) => match + '\n<!--\n' + notices.replace(/--/g, '- -') + '\n-->',
  );
  if (/<script\b[^>]*\bsrc\s*=/i.test(html) || /<link\b[^>]*rel="stylesheet"/i.test(html))
    throw new Error('O HTML não pode depender de arquivos externos.');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html.replace(/\r\n/g, '\n'));
  return { output, bytes: Buffer.byteLength(html) };
}
async function cli() {
  const result = await build();
  console.log('HTML independente gerado: ' + result.output);
  console.log(
    Math.ceil(result.bytes / 1024) +
      ' KB · React, CSS, JavaScript, imagens e licenças incorporados',
  );
}
module.exports = { build, cli };
if (require.main === module)
  cli().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
