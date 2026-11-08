# Repository instructions

## Commits and releases

- Use [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) for every new commit. Write a subject in the form `<type>(<optional scope>): <description>` and omit the parentheses when there is no scope. Use `feat` for new functionality, `fix` for bug fixes, and types such as `docs`, `test`, or `chore` for other changes. Mark breaking changes with `!` or a `BREAKING CHANGE` footer.
- Commit each feature or fix separately from release preparation. For example, use `feat(seasonal): add Christmas snowfall` for the feature and its **Unreleased** changelog entry. Use a separate `chore(release): prepare v0.3.0` commit for the version bump in `package.json` and `package-lock.json` and for moving the notes into the dated release section.
- Preserve that separation when merging PRs. Give GitHub merge and squash commits a Conventional Commit subject, such as `chore(merge): integrate seasonal snowfall` or `chore(release): promote v0.3.0`. Use a merge that retains the individual commits when a PR contains both feature work and release preparation.
- Follow the [contribution guide](CONTRIBUTING.md) for feature PRs to `development` and the [release checklist](docs/deployment.md#prepare-a-release) for promoting `development` to `main`.
