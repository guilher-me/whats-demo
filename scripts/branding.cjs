const fs = require('node:fs');
const path = require('node:path');
function brandHtml(root, html) {
  const icon = fs.readFileSync(path.join(root, 'assets', 'whatsdemo-icon.svg'), 'utf8');
  return html.replace(
    '<!-- APP_FAVICON -->',
    () =>
      `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}">`,
  );
}
module.exports = { brandHtml };
