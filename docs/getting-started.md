# Getting started

[← WhatsDemo](../README.md) · [User guide](user-guide.md) · [Build with an LLM](ai-guide.md)

## Use a portable copy

If someone has shared `whatsapp-fake-flows.html` with you, open it in a modern desktop browser. You do not need Node.js, a backend or a WhatsApp account to use the simulator. The application's code, styles, default images and instructions are embedded in the file.

Start with the Luma Home example, edit the contact and messages, then send a message in the phone or select automatic playback. See the [user guide](user-guide.md).

The HTML contains the app and its built-in example. Copying the HTML file does **not** bake your current locally saved journey into it. Use **Copy Link** to carry a custom journey, with the sharing constraints below.

## Requirements for developers

- Node.js **22.12+ within 22.x**, **24.x**, or **26+**, matching `package.json`.
- npm, included with the usual Node.js installations.
- Git to clone the repository, or a downloaded source archive.
- A modern desktop browser. Video recording requires browser support for Canvas capture and MediaRecorder; the available format varies by browser.

No database, API credentials or Meta application setup is required for the simulator.

## Install and run

```sh
git clone https://github.com/guilher-me/whats-demo.git
cd whats-demo
npm ci
npm run dev
```

Open the address printed by the development server, usually `http://127.0.0.1:5173`. The server rebuilds when files change; refresh the page to load the new build. If you downloaded an archive, open a terminal in its extracted project folder and start with `npm ci`.

## Build the portable HTML

```sh
npm run build
```

This checks TypeScript and generates `dist/whatsapp-fake-flows.html`, with JavaScript, CSS, images and dependency license notices embedded. The legacy filename is intentional for compatibility. Do not edit the generated HTML; change the source and rebuild.

The build also creates `llms.txt`, its `llm.txt` alias, `llms-full.txt` and the referenced `docs/` files beside the HTML. The standalone HTML embeds the AI instructions too.

## Share or host a build

- **Hand someone the app:** share the generated HTML. The recipient can open it without installing development tools.
- **Host it:** publish the contents of `dist/` on a static web host. Open `whatsapp-fake-flows.html` at that address; keep the documentation files beside it so the AI guide links work.
- **Share a custom journey:** use **Copy Link** from a hosted installation with a stable address. The URL fragment carries the project; no project database is involved.

A `file://` experience link only works where the app exists at that same path. Sending a local link alone does not make the HTML available to another computer. See [sharing and local storage](user-guide.md#share-a-demo).

## Commands

| Command                | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Start the local development server and rebuild on changes.      |
| `npm run build`        | Check types and generate the portable HTML and documentation.   |
| `npm test`             | Run regression tests for the engine, UI, saved links and build. |
| `npm run typecheck`    | Check TypeScript types.                                         |
| `npm run format`       | Format source and documentation with Prettier.                  |
| `npm run format:check` | Check formatting without changing files.                        |

For code changes, read [Contributing](../CONTRIBUTING.md). For agent integrations, read [Build with an LLM](ai-guide.md).
