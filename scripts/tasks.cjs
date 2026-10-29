const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
function execute(packageName, file, args) {
  const packageRoot = path.dirname(require.resolve(packageName + '/package.json'));
  const result = spawnSync(process.execPath, [path.join(packageRoot, file), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Comando falhou: ' + packageName);
}
async function run(task) {
  if (task === 'typecheck')
    return execute('typescript', 'bin/tsc', ['--project', path.join(ROOT, 'tsconfig.json')]);
  if (task === 'test') return execute('vitest', 'vitest.mjs', ['run', '--root', ROOT]);
  if (task === 'format' || task === 'format:check')
    return execute('prettier', 'bin/prettier.cjs', [
      task === 'format' ? '--write' : '--check',
      'src',
      'tests',
      'scripts',
      'docs',
      '.github',
      'index.html',
      '*.json',
      '*.md',
      'vitest.config.ts',
    ]);
  if (task === 'build') {
    await run('typecheck');
    return require('./build.cjs').cli();
  }
  if (task === 'dev') return require('./dev.cjs').start();
  throw new Error('Tarefa desconhecida: ' + task);
}
module.exports = { run };
