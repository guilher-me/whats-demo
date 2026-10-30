const fs = require('node:fs');

function validatePullRequest(event, repository) {
  const pr = event.pull_request;
  if (!pr) throw new Error('This check requires a pull request event.');
  if (
    pr.base.ref === 'main' &&
    (pr.head.ref !== 'development' || pr.head.repo?.full_name !== repository)
  )
    throw new Error(
      'Production promotions must come from this repository’s development branch. Open feature and fix PRs against development first.',
    );
  if (!['main', 'development'].includes(pr.base.ref))
    throw new Error('Open contributor PRs against development, then promote development to main.');
}
module.exports = { validatePullRequest };
if (require.main === module) {
  try {
    validatePullRequest(
      JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')),
      process.env.GITHUB_REPOSITORY,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
