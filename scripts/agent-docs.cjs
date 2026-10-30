const fs = require('node:fs');
const path = require('node:path');
function agentDocs(root, directory, template) {
  const index = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8');
  const full = index + '\n\n' + fs.readFileSync(path.join(root, 'docs', 'automation.md'), 'utf8');
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
