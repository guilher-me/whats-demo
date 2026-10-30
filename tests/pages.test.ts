import { afterEach, expect, it } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { projectStorageKey, STORAGE_KEY } from '../src/core/project';
const require = createRequire(import.meta.url);
const { prepare, publish, compose } = require('../scripts/pages.cjs');
const { validatePullRequest } = require('../scripts/pr-policy.cjs');
const temporary: string[] = [];
it('isolates development drafts while preserving production and portable storage keys', () => {
  for (const pathname of [
    '/whats-demo/development/',
    '/whats-demo/development/index.html',
    '/whats-demo/development/whats-demo.html',
    '/whats-demo/development/whatsapp-fake-flows.html',
  ])
    expect(projectStorageKey({ protocol: 'https:', pathname })).toBe(`${STORAGE_KEY}:development`);
  expect(projectStorageKey({ protocol: 'https:', pathname: '/whats-demo/' })).toBe(STORAGE_KEY);
  expect(projectStorageKey({ protocol: 'file:', pathname: '/development/index.html' })).toBe(
    STORAGE_KEY,
  );
});
afterEach(() => {
  for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'whatsdemo-deploy-test-'));
  temporary.push(root);
  const remote = join(root, 'remote.git'),
    source = join(root, 'source'),
    artifact = join(root, 'artifact');
  const git = (args: string[], cwd = root) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  };
  git(['init', '--bare', remote]);
  mkdirSync(source);
  mkdirSync(artifact);
  git(['init', '-b', 'main'], source);
  git(['config', 'user.name', 'Deployment test'], source);
  git(['config', 'user.email', 'test@example.com'], source);
  writeFileSync(join(source, 'README.md'), 'source');
  git(['add', '.'], source);
  git(['commit', '-m', 'initial'], source);
  git(['branch', 'development'], source);
  git(['remote', 'add', 'origin', remote], source);
  git(['push', 'origin', 'main', 'development'], source);
  const sha = git(['rev-parse', 'HEAD'], source);
  writeFileSync(join(artifact, 'whats-demo.html'), 'PRODUCTION 1');
  writeFileSync(join(artifact, 'llms.txt'), 'guide');
  mkdirSync(join(artifact, 'docs'));
  writeFileSync(join(artifact, 'docs', 'guide.md'), 'documentation');
  const update = (branch: string, version: string) => {
    git(['checkout', branch], source);
    writeFileSync(join(source, 'README.md'), version);
    git(['add', '.'], source);
    git(['commit', '-m', version], source);
    git(['push', 'origin', branch], source);
    return git(['rev-parse', 'HEAD'], source);
  };
  return { root, remote, artifact, sha, update };
}
it('keeps both environments across independent updates and skips stale source builds', () => {
  const { root, remote, artifact, sha, update } = fixture();
  expect(publish({ remote, source: artifact, target: 'production', sha })).toBe(true);
  writeFileSync(join(artifact, 'whats-demo.html'), 'DEVELOPMENT 1');
  expect(publish({ remote, source: artifact, target: 'development', sha })).toBe(true);
  const prod2 = update('main', 'release 2');
  rmSync(join(artifact, 'docs', 'guide.md'));
  writeFileSync(join(artifact, 'whats-demo.html'), 'PRODUCTION 2');
  expect(publish({ remote, source: artifact, target: 'production', sha: prod2 })).toBe(true);
  const destination = join(root, 'combined');
  compose({ remote, destination });
  expect(readFileSync(join(destination, 'index.html'), 'utf8')).toBe('PRODUCTION 2');
  expect(readFileSync(join(destination, 'development', 'index.html'), 'utf8')).toBe(
    'DEVELOPMENT 1',
  );
  expect(readFileSync(join(destination, 'development', 'llms.txt'), 'utf8')).toBe('guide');
  expect(existsSync(join(destination, 'docs', 'guide.md'))).toBe(false);
  expect(existsSync(join(destination, 'development', 'docs', 'guide.md'))).toBe(true);
  expect(existsSync(join(destination, '.git'))).toBe(false);
  const dev2 = update('development', 'staging 2');
  writeFileSync(join(artifact, 'whats-demo.html'), 'DEVELOPMENT 2');
  publish({ remote, source: artifact, target: 'development', sha: dev2 });
  expect(publish({ remote, source: artifact, target: 'production', sha })).toBe(false);
  const newer = join(root, 'newer');
  compose({ remote, destination: newer });
  expect(readFileSync(join(newer, 'index.html'), 'utf8')).toBe('PRODUCTION 2');
  expect(readFileSync(join(newer, 'development', 'index.html'), 'utf8')).toBe('DEVELOPMENT 2');
  expect(JSON.parse(readFileSync(join(newer, 'deployment.json'), 'utf8')).sourceRevision).toBe(
    prod2,
  );
}, 20000);
it('supports development being published before the first production deployment', () => {
  const { root, remote, artifact, sha } = fixture();
  publish({ remote, source: artifact, target: 'development', sha });
  const destination = join(root, 'site');
  compose({ remote, destination });
  expect(readFileSync(join(destination, 'index.html'), 'utf8')).toContain('./development/');
  expect(existsSync(join(destination, 'development', 'index.html'))).toBe(true);
});
it('does not interpret repository failures as a missing environment', () => {
  const { root } = fixture();
  expect(() =>
    compose({ remote: join(root, 'missing.git'), destination: join(root, 'site') }),
  ).toThrow('refusing to replace');
});
it('preserves the portable filename and rejects reserved paths, dotfiles and symbolic links', () => {
  const { root, artifact, sha } = fixture();
  const destination = join(root, 'ready');
  prepare(artifact, destination, 'production', sha);
  expect(readFileSync(join(destination, 'index.html'), 'utf8')).toBe(
    readFileSync(join(destination, 'whatsapp-fake-flows.html'), 'utf8'),
  );
  expect(readFileSync(join(destination, 'whats-demo.html'), 'utf8')).toBe('PRODUCTION 1');
  expect(JSON.parse(readFileSync(join(destination, 'deployment.json'), 'utf8')).sourceBranch).toBe(
    'main',
  );
  mkdirSync(join(artifact, 'development'));
  expect(() => prepare(artifact, join(root, 'reserved'), 'production', sha)).toThrow('reserved');
  rmSync(join(artifact, 'development'), { recursive: true });
  writeFileSync(join(artifact, '.git'), 'hostile');
  expect(() => prepare(artifact, join(root, 'dotfiles'), 'production', sha)).toThrow('Unsupported');
  rmSync(join(artifact, '.git'));
  const outside = join(root, 'outside');
  mkdirSync(outside);
  symlinkSync(outside, join(artifact, 'escape'), 'junction');
  expect(() => prepare(artifact, join(root, 'links'), 'production', sha)).toThrow('Unsupported');
});
it('accepts a legacy build while publishing the branded filename and hosted alias', () => {
  const { root, artifact, sha } = fixture();
  rmSync(join(artifact, 'whats-demo.html'));
  writeFileSync(join(artifact, 'whatsapp-fake-flows.html'), 'LEGACY');
  const destination = join(root, 'legacy');
  prepare(artifact, destination, 'production', sha);
  for (const name of ['index.html', 'whats-demo.html', 'whatsapp-fake-flows.html'])
    expect(readFileSync(join(destination, name), 'utf8')).toBe('LEGACY');
});
it.each([
  ['development', 'codex/new-feature', 'owner/repo', true],
  ['development', 'feature', 'contributor/fork', true],
  ['main', 'development', 'owner/repo', true],
  ['main', 'codex/new-feature', 'owner/repo', false],
  ['main', 'development', 'contributor/fork', false],
  ['other', 'feature', 'owner/repo', false],
])('checks PR promotion %s <- %s from %s', (base, head, repository, allowed) => {
  const event = {
    pull_request: { base: { ref: base }, head: { ref: head, repo: { full_name: repository } } },
  };
  if (allowed) expect(() => validatePullRequest(event, 'owner/repo')).not.toThrow();
  else expect(() => validatePullRequest(event, 'owner/repo')).toThrow();
});
