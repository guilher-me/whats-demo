const path = require('node:path');
const { spawnSync } = require('node:child_process');

for (const filename of ['test-engine.cjs', 'test-share.cjs', 'test-build.cjs']) {
  const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'tests', filename)], {
    stdio: 'inherit',
    shell: false
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
