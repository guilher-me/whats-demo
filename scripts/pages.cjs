const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const branches = { production: 'main', development: 'development' };
function environment(value) {
  if (!Object.hasOwn(branches, value)) throw new Error('Unknown deployment environment.');
  return value;
}
function copyTree(source, target, { repository = false } = {}) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (repository && entry.name === '.git') continue;
    if (entry.name.startsWith('.') || entry.isSymbolicLink())
      throw new Error(`Unsupported site entry: ${entry.name}`);
    const from = path.join(source, entry.name),
      to = path.join(target, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
    else throw new Error(`Unsupported site entry: ${entry.name}`);
  }
}
function prepare(source, destination, target, sha) {
  environment(target);
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid source revision.');
  if (fs.existsSync(path.join(source, 'development')))
    throw new Error('The development namespace is reserved.');
  const portable = ['whats-demo.html', 'whatsapp-fake-flows.html'].find((name) =>
    fs.existsSync(path.join(source, name)),
  );
  if (!portable) throw new Error('Portable HTML is missing.');
  copyTree(source, destination);
  // Keep previously shared hosted URLs working, including their project fragments.
  for (const name of ['index.html', 'whats-demo.html', 'whatsapp-fake-flows.html'])
    if (name !== portable)
      fs.copyFileSync(path.join(destination, portable), path.join(destination, name));
  fs.writeFileSync(
    path.join(destination, 'deployment.json'),
    JSON.stringify(
      { environment: target, sourceBranch: branches[target], sourceRevision: sha },
      null,
      2,
    ) + '\n',
  );
}
function git(remote, token = '') {
  const auth = Buffer.from(`x-access-token:${token}`).toString('base64');
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_TRACE: '0', GIT_CURL_VERBOSE: '0' };
  if (token)
    Object.assign(env, {
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${auth}`,
    });
  const run = (args, cwd) => {
    const result = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
    if (result.error) throw result.error;
    return result;
  };
  const checked = (args, cwd) => {
    const result = run(args, cwd);
    if (result.status !== 0)
      throw new Error(
        `Git operation failed (${result.status}): ${result.stderr.replaceAll(auth, '[redacted]').replaceAll(token || '\0', '[redacted]')}`,
      );
    return result.stdout.trim();
  };
  const revision = (branch) => {
    const result = run(['ls-remote', '--exit-code', '--heads', remote, `refs/heads/${branch}`]);
    if (result.status === 2) return null;
    if (result.status !== 0)
      throw new Error(
        'Cannot read deployment repository; refusing to replace existing environments.',
      );
    const sha = result.stdout.split(/\s/)[0];
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Unexpected remote revision.');
    return sha;
  };
  const checkout = (branch, directory) => {
    if (!revision(branch)) return false;
    checked([
      'clone',
      '--quiet',
      '--depth=1',
      '--single-branch',
      '--branch',
      branch,
      remote,
      directory,
    ]);
    return true;
  };
  return { checked, revision, checkout };
}
/** Each environment owns its state branch; no deployment can delete the other's build. */
function publish({ remote, token, source, target, sha }) {
  environment(target);
  const client = git(remote, token);
  if (client.revision(branches[target]) !== sha) return false;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'whatsdemo-pages-'));
  try {
    const ready = path.join(temporary, 'ready'),
      state = path.join(temporary, 'state');
    prepare(source, ready, target, sha);
    const branch = `pages-${target}`;
    if (!client.checkout(branch, state)) {
      fs.mkdirSync(state);
      client.checked(['init', '--quiet', '-b', branch], state);
      client.checked(['remote', 'add', 'origin', remote], state);
    }
    // This is a dedicated temporary Git checkout, never the developer's workspace.
    for (const entry of fs.readdirSync(state))
      if (entry !== '.git') fs.rmSync(path.join(state, entry), { recursive: true, force: true });
    copyTree(ready, state);
    client.checked(['config', 'user.name', 'github-actions[bot]'], state);
    client.checked(
      ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'],
      state,
    );
    client.checked(['add', '--all'], state);
    const changes = client.checked(['diff', '--cached', '--name-only'], state);
    if (changes) {
      client.checked(['commit', '--quiet', '-m', `Publish ${target} ${sha}`], state);
      client.checked(['push', '--quiet', 'origin', `HEAD:refs/heads/${branch}`], state);
    }
    return true;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
/** Always compose the latest persisted pair, even if an older pending Pages job was superseded. */
function compose({ remote, token, destination }) {
  const client = git(remote, token);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'whatsdemo-site-'));
  try {
    const production = path.join(temporary, 'production'),
      development = path.join(temporary, 'development');
    const hasProduction = client.checkout('pages-production', production);
    const hasDevelopment = client.checkout('pages-development', development);
    if (!hasProduction && !hasDevelopment) throw new Error('No environment has been published.');
    if (fs.existsSync(destination)) throw new Error('Site destination must be new.');
    if (hasProduction) {
      if (fs.existsSync(path.join(production, 'development')))
        throw new Error('Reserved namespace in production state.');
      copyTree(production, destination, { repository: true });
    } else {
      fs.mkdirSync(destination, { recursive: true });
      fs.writeFileSync(
        path.join(destination, 'index.html'),
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>WhatsDemo</title><h1>WhatsDemo</h1><p>Production has not been deployed yet.</p><a href="./development/">Open development</a></html>',
      );
    }
    if (hasDevelopment)
      copyTree(development, path.join(destination, 'development'), { repository: true });
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
function main() {
  const [command, directory] = process.argv.slice(2);
  if (!/^[\w.-]+\/[\w.-]+$/.test(process.env.GITHUB_REPOSITORY || ''))
    throw new Error('Invalid repository.');
  const remote = `https://github.com/${process.env.GITHUB_REPOSITORY}.git`;
  if (command === 'publish') {
    const published = publish({
      remote,
      token: process.env.GITHUB_TOKEN,
      source: directory,
      target: process.env.DEPLOY_ENVIRONMENT,
      sha: process.env.SOURCE_REVISION,
    });
    if (process.env.GITHUB_OUTPUT)
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `published=${published}\n`);
    if (!published)
      console.log('Source branch advanced during the build; this outdated deployment was skipped.');
  } else if (command === 'compose')
    compose({ remote, token: process.env.GITHUB_TOKEN, destination: directory });
  else throw new Error('Expected publish or compose.');
}
module.exports = { prepare, publish, compose };
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
