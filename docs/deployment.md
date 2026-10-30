# GitHub Pages and branch workflow

[← WhatsDemo](../README.md) · [Contributing](../CONTRIBUTING.md)

## Source promotion

```text
feature or fix branch → PR → development → PR → main
```

Create work branches from `development` and open contributor PRs against `development`. Release through a PR from this repository's `development` branch into `main`. PRs from feature branches or a fork's branch directly into `main` fail **PR branch policy**. A maintenance PR from `main` back into `development` is allowed to synchronize a release merge.

CI checks formatting, types, tests and the portable build. Pull requests build with a read-only token and never deploy. The routing check uses the normal `pull_request` event so its result can be required on the PR head. It evaluates event metadata using the protected base branch's policy (`development` when targeting `main`); it never installs or executes PR-head code.

## Environments

| Workflow        | Source        | Trigger                                                     | Site path                  |
| --------------- | ------------- | ----------------------------------------------------------- | -------------------------- |
| **Production**  | `main`        | Push to `main`; manual retry is also available.             | `/whats-demo/`             |
| **Development** | `development` | Manual **Run workflow** from the workflow's `main` version. | `/whats-demo/development/` |

Deployment workflows always run from `main`; the development workflow explicitly checks out `development` for its build. It does not publish an arbitrary feature branch. A development merge runs CI but does not automatically update the development site.

Each deployment validates its source before publishing. If the source branch advances while it builds, the outdated result is skipped; rerun the manual development workflow to publish the new revision.

The expected URLs for this repository are:

- Production: `https://guilher-me.github.io/whats-demo/`
- Development: `https://guilher-me.github.io/whats-demo/development/`

They become available after their first successful deployment. The development site may exist before production; in that case the root page links to development until production is published.

Development URLs use a separate local project-draft key so testing a journey there does not overwrite the production draft in the same browser. Production keeps its existing storage key and saved links remain compatible. Language and playback-pace preferences can still be shared across the site's origin.

## One site, two independent snapshots

GitHub Pages publishes a complete site artifact. A development-only upload would otherwise remove production, and a production-only upload would remove development.

The reusable workflow stores validated static snapshots in the generated **`pages-production`** and **`pages-development`** branches. These are bot-managed build storage, not contributor branches; never open source PRs against them or edit their files manually.

Publishing is serialized per environment. The final Pages job uses one shared concurrency group and reads the latest pair of stored snapshots, then places production at the root and development under `development/`. A pending GitHub concurrency job may be superseded; the surviving job still includes both persisted environments. Production updates therefore preserve development and vice versa. Repository/authentication failures stop composition rather than treating an existing environment as empty.

Every environment includes `index.html`, the original `whatsapp-fake-flows.html`, the AI guides and documentation. `deployment.json` identifies its environment and source commit. The single-file app can still be downloaded and opened independently.

The snapshot is pushed before the Pages deployment. If the deployment fails, the previous live site remains; retry the workflow to compose and publish the stored pair. Snapshots are retained in Git rather than relying on expiring Actions artifacts.

## Repository setup

The workflows alone cannot enforce pull requests or enable GitHub Pages settings. A repository administrator must configure:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. A `development` branch, initially based on `main`.
3. Branch protection for **both `main` and `development`**: require pull requests, require **Validate project** and **PR branch policy**, block force pushes and deletion, and apply the rules to administrators. The number of human approvals can reflect the team's size; the routing and CI checks are separate from review approval.
4. The **github-pages** environment's deployment-branch rule must allow `main`. Both deployment workflows execute from that branch, even when building development. Do not require the source `development` branch here.

For the initial bootstrap, merge the workflow/policy files into `development` and then `main` through PRs before making the newly introduced check required. The protected branch must contain the policy script before the metadata check can execute it. Once installed, enable both required checks for normal changes.

The build has read-only repository access. Only the snapshot job has `contents: write`; only the final Pages job has `pages: write` and `id-token: write`. No personal access token is needed in repository secrets.

References: [custom GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
