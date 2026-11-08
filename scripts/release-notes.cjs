const fs = require('node:fs');
const path = require('node:path');

const versionPattern = '(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)';
const releaseHeading = new RegExp(`^\\[(${versionPattern})\\] - (\\d{4}-\\d{2}-\\d{2})$`);
const categories = new Set(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']);

function parseChangelog(markdown, version, requireRelease) {
  const seen = new Set();
  const releases = markdown
    .replace(/\r\n/g, '\n')
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const [heading, ...groups] = section.trim().split(/^### /m);
      const name = heading.trim();
      const match = releaseHeading.exec(name);
      if (!match && name !== '[Unreleased]') throw new Error(`Invalid changelog heading: ${name}`);
      const id = match ? match[1] : 'Unreleased';
      if (seen.has(id)) throw new Error(`Duplicate changelog version: ${id}`);
      seen.add(id);
      return {
        version: id,
        date: match?.[2],
        groups: groups.map((group) => {
          const [category, ...lines] = group.trim().split('\n');
          if (!categories.has(category)) throw new Error(`Invalid changelog category: ${category}`);
          const bullets = lines.filter((line) => line.trim());
          if (!bullets.length || bullets.some((line) => !/^- \S/.test(line)))
            throw new Error(`Use plain Markdown bullets under ${id} / ${category}.`);
          return { category, items: bullets.map((line) => line.slice(2)) };
        }),
      };
    });

  if (releases[0]?.version !== 'Unreleased' || releases[1]?.version !== version)
    throw new Error(
      `CHANGELOG.md must start with Unreleased, followed by package version ${version}.`,
    );
  if (requireRelease && releases[0].groups.length)
    throw new Error('Move Unreleased notes into the version being promoted to main.');
  return releases;
}

function releaseAssets(root, directory, template) {
  const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
  const { version } = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  if (lock.version !== version || lock.packages?.['']?.version !== version)
    throw new Error('package.json and package-lock.json must have the same version.');

  const markdown = read('CHANGELOG.md');
  const releases = parseChangelog(
    markdown,
    version,
    process.env.WHATSDEMO_REQUIRE_RELEASE === 'true',
  );
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'CHANGELOG.md'), markdown);
  fs.writeFileSync(
    path.join(directory, 'version.json'),
    JSON.stringify({ version }, null, 2) + '\n',
  );
  return template.replace(
    '<!-- APP_RELEASE -->',
    () =>
      `<meta name="whatsdemo-version" content="${version}" />\n` +
      '<script type="application/json" id="release-notes">' +
      JSON.stringify(releases).replace(/</g, '\\u003c') +
      '</script>',
  );
}

module.exports = { releaseAssets, parseChangelog };
