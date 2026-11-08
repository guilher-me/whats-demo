const fs = require('node:fs'),
  path = require('node:path'),
  esbuild = require('esbuild');
const { agentDocs } = require('./agent-docs.cjs');
const { releaseAssets } = require('./release-notes.cjs');
const { brandHtml } = require('./branding.cjs');
const { shareBuildOptions } = require('./build.cjs');
async function start() {
  const root = path.resolve(__dirname, '..'),
    directory = path.join(root, '.dev');
  fs.mkdirSync(directory, { recursive: true });
  const html = agentDocs(
    root,
    directory,
    brandHtml(root, fs.readFileSync(path.join(root, 'index.html'), 'utf8'))
      .replace('<!-- APP_STYLES -->', '<link rel="stylesheet" href="app.css">')
      .replace('<!-- APP_SCRIPT -->', '<script defer src="app.js"></script>'),
  );
  fs.writeFileSync(path.join(directory, 'index.html'), releaseAssets(root, directory, html));
  const context = await esbuild.context({
    absWorkingDir: root,
    entryPoints: ['src/main.tsx'],
    bundle: true,
    outfile: path.join(directory, 'app.js'),
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    sourcemap: true,
    loader: { '.png': 'dataurl', '.svg': 'dataurl' },
    define: { 'process.env.NODE_ENV': '"development"' },
  });
  const share = await esbuild.context(shareBuildOptions(root, directory));
  await Promise.all([context.watch(), share.watch()]);
  const server = await context.serve({ host: '127.0.0.1', port: 5173, servedir: directory });
  console.log(`Local: http://127.0.0.1:${server.port}`);
  const stop = async () => {
    await Promise.all([context.dispose(), share.dispose()]);
    process.exit();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
module.exports = { start };
