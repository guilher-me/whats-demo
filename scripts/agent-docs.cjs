const fs = require('node:fs');
const path = require('node:path');
function agentDocs(root, directory, template) {
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const index = fs
    .readFileSync(path.join(root, 'llms.txt'), 'utf8')
    .replace(/^> .+\r?\n/m, (summary) => `${summary}\nApp version: ${version}.\n`);
  const guide = fs
    .readFileSync(path.join(root, 'docs', 'automation.md'), 'utf8')
    .replace(
      /\]\((?![#/]|[a-z][a-z0-9+.-]*:)([^()\s]+)\)/gi,
      (_, href) => '](' + path.posix.normalize('docs/' + href) + ')',
    );
  const full = index + '\n\n' + guide;
  fs.mkdirSync(directory, { recursive: true });
  for (const filename of ['llms.txt', 'llm.txt'])
    fs.writeFileSync(path.join(directory, filename), index);
  fs.writeFileSync(path.join(directory, 'llms-full.txt'), full);
  fs.cpSync(path.join(root, 'docs'), path.join(directory, 'docs'), { recursive: true });
  fs.cpSync(path.join(root, 'schemas'), path.join(directory, 'schemas'), { recursive: true });
  return template.replace(
    '<!-- LLM_DOCS -->',
    () =>
      '<script type="text/plain" id="llms-txt">' +
      full.replace(/<\/script/gi, '<\\/script') +
      '</script>',
  );
}
module.exports = { agentDocs };
