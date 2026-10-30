# Contributing to WhatsDemo

[← Project overview](README.md) · [Install & run](docs/getting-started.md) · [Architecture](docs/architecture.md)

Contributions to the editor, message components, Flows, accessibility, translations and documentation are welcome. Start with a specific problem and the behavior you want to improve. For a substantial change, open an issue to discuss the scope before implementing it.

## Set up the project

Create feature/fix branches from `development` and open PRs into `development`. Promote releases through a PR from `development` into `main`; do not target production directly from a feature branch. See [the branch and deployment workflow](docs/deployment.md) for CI, manual development deployment and repository protection settings.

Follow the [requirements and installation guide](docs/getting-started.md), then run:

```sh
npm ci
npm run dev
```

Edit files in `src/`. The HTML in `dist/` is generated; do not edit or commit it. The build must continue to produce a single portable HTML file for people who do not use development tools.

## Keep components focused

- Put reusable UI primitives in `src/components/ui` and shared SVG icons in `src/components/icons`.
- Keep feature-specific components and hooks together under `src/features/<feature>`.
- Keep the persisted model and engine rules in `src/core`, independent of React. Isolate browser-specific image decoding and rewriting in `core/images`.
- Pass data and callbacks through props. Hooks coordinate state and effects; avoid coupling generic components to the editor's global state.
- Use semantic tokens from `src/styles/tokens.css`, native controls where appropriate, accessible names, keyboard interaction and linked error messages.
- Keep a functional change separate from unrelated file reorganizations.

The [architecture](docs/architecture.md), [design reference](docs/design.md) and [accessibility reference](docs/accessibility.md) explain the existing patterns. These reference guides are currently in Brazilian Portuguese; English documentation improvements are welcome.

To add a Flow field, update validation in `core/engine.ts`, rendering in `features/flows/components/FlowField.tsx` and automatic filling in `features/playback/hooks/usePlayback.ts`. Cover meaningful validation, navigation and playback behavior. For business message extensions, see [message components](docs/messages.md).

## Preserve saved links and automation

Do not change the meaning of the `v1z` and `v1j` link prefixes or reuse existing fields for incompatible behavior. Keep the legacy fixtures and compatibility tests. An incompatible schema change needs an explicit new version and migration.

The public browser API uses `window.whatsappFakeFlows` with `apiVersion: 1`. Preserve that contract, including synchronous methods. Update [automation documentation](docs/automation.md) and the `llms.txt` index when tool-facing behavior changes.

Untrusted photos must pass through the shared validation and rewriting pipeline before rendering or sharing. Do not add a raw `img.src` bypass. Read the [image security policy](docs/IMAGE-SECURITY.md) before changing that boundary.

## Translate interface text

Use `useT()` and semantic keys from `src/i18n/locales/`. Add each new interface string in **English**, **Spanish** and **Brazilian Portuguese**. Do not automatically translate user-authored messages or Flow JSON. See the [localization reference](docs/localization.md).

## Validate your change

```sh
npm run format
npm run typecheck
npm test
npm run build
```

Run checks appropriate to the change. Exercise manual playback, automatic playback and the generated portable HTML when their behavior is affected. Include small fictional journeys for engine or playback regressions. For documentation-only changes, check formatting, links and referenced media; add no tests that merely duplicate prose.

## Open a pull request

Explain the problem, the resulting behavior and how you validated it. Mention material limitations. Include before/after screenshots for visual changes and use fictional data throughout. Keep component changes concise enough for another contributor to extend them.

Documentation media lives in `docs/media/`. Capture the actual application, keep files reasonably small and describe how to reproduce the captured scenario. Do not change production behavior just to produce a screenshot.

## License

WhatsDemo is released under the [MIT license](LICENSE), © 2026 Guilherme Cardoso. Preserve dependency notices and record sources and licenses when adding third-party assets.
