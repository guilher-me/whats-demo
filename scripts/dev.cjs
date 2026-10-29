const fs = require('node:fs'),
  path = require('node:path'),
  esbuild = require('esbuild');
const { agentDocs } = require('./agent-docs.cjs');
async function start() {
  const root = path.resolve(__dirname, '..'),
    directory = path.join(root, '.dev');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'index.html'),
    agentDocs(
      root,
      directory,
      fs
        .readFileSync(path.join(root, 'index.html'), 'utf8')
        .replace('<!-- APP_STYLES -->', '<link rel="stylesheet" href="app.css">')
        .replace('<!-- APP_SCRIPT -->', '<script defer src="app.js"></script>'),
    ),
  );
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
    loader: { '.png': 'dataurl' },
    define: { 'process.env.NODE_ENV': '"development"' },
  });
  await context.watch();
  const server = await context.serve({ host: '127.0.0.1', port: 5173, servedir: directory });
  console.log(`Local: http://127.0.0.1:${server.port}`);
  const stop = async () => {
    await context.dispose();
    process.exit();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
module.exports = { start };
