# Automation API v2

WhatsApp Fake Flows exposes `window.whatsappFakeFlows` to tools allowed to execute JavaScript in the current page. This is a browser API, not an HTTP endpoint or MCP server. A tool restricted to read-only JavaScript must use its normal UI controls for mutations.

The `llms.txt` file provides instructions; it does not execute a model or automatically connect an agent. There is no API key, external LLM dependency or server in this integration.

## Generate links from an AI tool

Construct a JSON-compatible project using the contract below. Use the guide, schema and generator from the same deployment. Configure it through the public API or visible controls when the user authorizes changing the active draft.

- **Browser API** — call `validateProject(project)` first. Check the automatic diagnostics before testing automatic playback. When authorized, load the normalized result with `loadProject(validation.project)`. Pass the project directly to `createShareURL(project, 'demo')` to generate an interactive player link without changing the draft. Omitting the mode opens the editor.
- **Browser controls** — paste the whole journey in **Code**, use **Validate** and **Apply**, then select **Copy link**. The copied link opens with only **Preview** expanded and uses the current interface language.
- **Static module** — the hosted build publishes `share.mjs` beside the app. It exports `createShareURL(project, mode?, baseURL?, locale?, view?)`. The default opens the production editor. Pass a reachable app address and `'en'`, `'es'` or `'pt-BR'` as needed. In editor mode, pass `'preview'` as the fifth argument to start with **Code** and **Editor** collapsed.

The two modes use the same compressed payload. The link includes the interface language and keeps the browser language preference separate. The site reads it from the fragment. Links have a maximum length of 8,000 characters, with a 128 KiB uncompressed limit. If the generator reports a limit error, shorten the conversation and try again. Use sample data because link recipients can read all project content.

## Browser API and readiness

The editor contains `<link rel="describedby">` links and a `whatsapp-fake-flows-api` meta tag. Wait for the API and `getState().ready` before working with the editor. The `whatsapp-fake-flows:ready` event reports the API version. The demo view exposes the interactive phone and offers **Edit a copy**.

| Member                          | Contract                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiVersion`, `projectVersion`  | Current values are 2 and 1.                                                                                                                                         |
| `getInstructions()`             | Embedded agent instructions.                                                                                                                                        |
| `getProject()`, `getExample()`  | Independent copies of the current project and showcase.                                                                                                             |
| `getState()`                    | Snapshot with readiness, playback status and rendered messages.                                                                                                     |
| `validateProject(input)`        | Returns `{ valid: true, project }` or `{ valid: false, errors }` without changing the draft. Also returns Flow diagnostics when the project structure can be read.  |
| `createShareURL(input?, mode?)` | Returns a promise for a validated link. Defaults to the current project and editor mode.                                                                            |
| `loadProject(input)`            | Validates and replaces the current editor draft. Returns the normalized project. Call only when authorized.                                                         |
| `play(mode?)`                   | Runs the project and resolves with the final state. Defaults to `automatic`; use `void api.play('manual')` to start without waiting for user interaction to finish. |
| `stop()`, `reset()`             | Interrupt playback. Reset also clears rendered messages.                                                                                                            |

`getState()` returns `ready`, `running`, `status`, `activeStep`, `flowScreen`, `pendingMessageId` and `messages`. Use booleans and nullable fields for coordination. Rendered messages include `direction`, `text` and `time`. Attachment messages include the actual `attachmentId` sent in playback, and the caption appears in `text`. Voice notes include `voiceDurationMs`.

In browser controls, scope editing to **Conversation editor** and expand a step through **Edit step N**. Choose the extension and enter the image text or document metadata directly on the step. In **Conversation preview**, use **Start manually** or **Play automatically**. Follow the accessible labels in the selected interface language.

## Project contract

```ts
{
  version: 1,
  contact: { name: string, verified: boolean },
  steps: Step[]
}
```

The fixed store icon is included with the app. Set the contact name and whether the verified badge should appear. The [JSON schema](../schemas/project-v1.schema.json) describes the structure. The generator checks project structure and message rules. Use the editor or browser API for Flow diagnostics and playback checks.

Every step has a unique string `id`, `type`, `text` and a numeric `delay` between 0 and 120 seconds. The maximum is 200 steps. Use deterministic IDs when generating a journey. Missing or duplicate step IDs are normalized, but explicit unique IDs make later updates easier.

- `type: 'user'`: user message; automatic mode types `text` and sends it. Manual mode waits for a user to send a message.
- A customer step with `voiceDurationSeconds` uses the simulated voice composer. Set `text` to `''` and use an integer from 1 to 120. Automatic playback holds the microphone for that many seconds after moving the simulated cursor to it. Manual playback uses the actual hold time. A sent voice bubble has `voiceDurationMs` in `getState().messages`.
- `type: 'business'`: company message; optional `typing` boolean defaults to true. With no `interactive` field it is plain text.
- `type: 'flow'`: a Flow invitation; additionally requires `label`, `flow`, `answers` and optionally `completion` and `typing`.

The sequence is linear. Reply buttons and lists wait for a choice and append that choice as a user response; they do not branch to different steps. Do not add a separate user step just to repeat the selected option.

## Simulated attachments

Configure a simulated file in the step’s `media.file`. Use `text: ''` for media steps.

- An image uses `media: { kind: 'image', file: { extension: 'jpg', name: 'IMG 01' }, caption: 'Optional caption' }`. Supported extensions are `png` and `jpg`. The name appears on the image preview and can contain up to 48 characters. Use an empty string for the default label.
- A document uses `media: { kind: 'document', file: { extension: 'pdf', name: 'Estimate', size: 240, unit: 'KB' } }`. Supported extensions are `pdf`, `txt`, `doc`, `docx`, `xls`, `xlsx`, `ppt` and `pptx`. Use a positive number and the unit `KB` or `MB`. The maximum is 100 MB or 100,000 KB. Use a name of up to 60 characters. The selected extension is appended to the filename.

Automatic playback sends the configured file. Manual playback lists the matching files from all steps. Inline files use `media:<step-id>` as the recorded `attachmentId`. Omit media sources, document covers and avatars.

## Reply buttons

```json
{
  "id": "welcome",
  "type": "business",
  "text": "Como podemos ajudar?",
  "delay": 1,
  "typing": true,
  "interactive": {
    "kind": "buttons",
    "header": "Atendimento",
    "footer": "Selecione uma opção.",
    "buttons": [
      { "id": "schedule", "title": "Agendamento" },
      { "id": "agent", "title": "Falar com atendente" }
    ],
    "autoReplyId": "agent"
  }
}
```

Use 1–3 buttons. Each title must be nonempty, distinct and at most 20 characters; each ID must be unique within the message and at most 256 characters. Optional header and footer accept up to 60 characters. Interactive body text must be nonempty and at most 1024 characters in this simulator. If autoReplyId is omitted or empty, automatic mode chooses the first option.

## Lists

```json
{
  "id": "services",
  "type": "business",
  "text": "Escolha o serviço desejado.",
  "delay": 1,
  "interactive": {
    "kind": "list",
    "button": "Ver serviços",
    "sections": [
      {
        "title": "Agendamento",
        "rows": [
          { "id": "consultation", "title": "Consulta", "description": "Agendar uma consulta" },
          { "id": "exam", "title": "Exame", "description": "Consultar opções de exames" }
        ]
      }
    ],
    "autoReplyId": "consultation"
  }
}
```

Use 1–10 sections and at most 10 rows across all sections combined. Each section needs at least one row. Section titles accept 24 characters and are required when there is more than one section. Row titles accept 24 characters, descriptions 72 and IDs 200. IDs must be unique across the whole list. The invitation button is nonempty and accepts 20 characters. Header, footer and body limits match reply messages.

## Flows

A Flow step's `flow` field contains the JSON definition, not a Flow URL. `answers` maps form field names to values used in automatic mode. Supply an answer for every required field reached by the chosen route. In the editor, open **Automatic answers** to use field controls or edit the same map in **JSON**. New Flow fields receive a valid fictional example when available. **Fill missing answers** only adds absent keys. Runtime-dependent choices and custom text patterns require a configured answer.

Supported leaf components: TextHeading, TextSubheading, TextBody, TextCaption, RadioButtonsGroup, CheckboxGroup, Dropdown, OptIn, TextInput, TextArea, DatePicker and Footer. Layout containers and If conditions are flattened by the engine. The simulator supports `navigate` to a screen and `complete`; it does not implement server-backed data_exchange or the full Meta API. The local diagnostics report Flow JSON issues and simulator coverage. Missing required answers and answers that reference unavailable options are shown before automatic playback, while manual playback remains available. The editor offers synchronized Visual and JSON tabs for the same Flow definition. The Meta Playground is available for comparison.

Use ISO dates (YYYY-MM-DD), option IDs for single choice fields, arrays of IDs for checkbox groups, booleans for OptIn and strings for text fields. Expressions reference `${form.field}` and `${data.field}`. Preserve the Meta Flow field names such as `data-source` and `on-click-action`.

## Complete runnable example

Once `api.getState().ready` is true:

```js
const api = window.whatsappFakeFlows;
const journey = {
  version: 1,
  contact: { name: 'Empresa exemplo', verified: false },
  steps: [
    { id: 'hello', type: 'user', text: 'oi', delay: 0.3 },
    {
      id: 'menu',
      type: 'business',
      text: 'Como podemos ajudar?',
      delay: 1,
      interactive: {
        kind: 'buttons',
        buttons: [{ id: 'schedule', title: 'Agendamento' }],
        autoReplyId: 'schedule',
      },
    },
    {
      id: 'identification',
      type: 'flow',
      text: 'Confirme seu nome para continuar.',
      label: 'Preencher dados',
      completion: 'Dados confirmados',
      delay: 1,
      answers: { name: 'Cliente exemplo' },
      flow: {
        version: '7.3',
        screens: [
          {
            id: 'IDENTIFICATION',
            title: 'Identificação',
            terminal: true,
            layout: {
              type: 'SingleColumnLayout',
              children: [
                { type: 'TextInput', name: 'name', label: 'Nome', required: true },
                {
                  type: 'Footer',
                  label: 'Confirmar',
                  'on-click-action': { name: 'complete', payload: { name: '${form.name}' } },
                },
              ],
            },
          },
        ],
      },
    },
    { id: 'protocol', type: 'business', text: 'Seu protocolo de exemplo é 20260001.', delay: 2 },
  ],
};
const validation = api.validateProject(journey);
if (!validation.valid) throw new Error(validation.errors.join('\n'));
const issues = validation.diagnostics.filter(
  ({ kind }) => kind === 'automatic' || kind === 'simulator',
);
if (issues.length)
  throw new Error(issues.map(({ path, message }) => `${path} — ${message}`).join('\n'));

// Use the active editor for playback only when the user authorized replacing its draft.
api.loadProject(validation.project);
const result = await api.play('automatic');
if (!result.messages.some(({ text }) => text === 'Seu protocolo de exemplo é 20260001.')) {
  throw new Error(result.status);
}
const shareURL = await api.createShareURL(validation.project, 'demo');
```

## Static module example

In a Node.js environment with access to the official hosted module:

```js
const response = await fetch('https://guilher-me.github.io/whats-demo/share.mjs');
if (!response.ok) throw new Error('Could not load the WhatsDemo generator.');
const moduleURL =
  'data:text/javascript;base64,' + Buffer.from(await response.arrayBuffer()).toString('base64');
const { createShareURL } = await import(moduleURL);
const project = {
  version: 1,
  contact: { name: 'Harbor Cycles', verified: false },
  steps: [
    {
      id: 'photo',
      type: 'user',
      text: '',
      delay: 0,
      media: {
        kind: 'image',
        file: { extension: 'jpg', name: 'IMG 01' },
        caption: 'Damaged part',
      },
    },
    {
      id: 'estimate',
      type: 'business',
      text: '',
      delay: 1,
      media: {
        kind: 'document',
        file: { extension: 'pdf', name: 'Estimate', size: 240, unit: 'KB' },
      },
    },
  ],
};
console.log(await createShareURL(project, 'demo'));
```

## Compatibility and contribution

API v2 uses `createShareURL` and `loadProject` for simulated attachments. New links use a `v3z` alphanumeric payload. Existing `v2z` links still open in both modes. Existing `#project=v1z…` and `#project=v1j…` links open as demos. Invalid links leave the local draft intact.

The implementation uses the same codec and project validation in the app, public module and browser API. Add tests for contract changes and update the schema and instructions together.

## Durante uma gravação

A gravação de vídeo é iniciada pelos controles da interface. Enquanto está ativa, `loadProject`, `play`, `stop` e `reset` rejeitam operações que poderiam interromper a captura. Consultas, validação e criação de links continuam disponíveis. Finalize ou cancele a gravação pela interface antes de alterar a jornada pela API. O link carrega somente a configuração da jornada.

## Formatação do texto

O campo `text` das etapas aceita `*negrito*`, `_itálico_` e `~tachado~`, inclusive combinados, por exemplo `*_texto_*`. Envie e preserve os marcadores no JSON; o aplicativo os interpreta apenas na apresentação do corpo da mensagem. Não envie HTML para obter estilos. Rótulos de botões e definições de campos do Flow não passam por esse interpretador.

## Typed message buttons

For `interactive.kind: "buttons"`, set optional `context` to `"interactive"` (default) or `"template"`. Each button has `id`, `title` and optional `type`: `"quick_reply"` (default), `"url"` with `url`, `"phone_number"` with `phoneNumber`, `"copy_code"` with `code`, or `"voice_call"` with optional integer `ttlMinutes`. See [message rules](messages.md#button-types-and-contexts) before combining types. In mixed templates, `autoReplyId` must target a quick reply; action-only messages may target an action. Action buttons open a phone-contained simulation, not an external site/call/clipboard operation. UI selects are labeled `Message context` and `Button type`; URL, phone, code and TTL fields appear for the chosen type. More than three template buttons use `See all options`.

## Simulated commerce

Add a top-level `catalog` array with up to 200 products. Each product has a unique `sku`, a `name`, a `description` and a positive integer `priceCents` in BRL. Product images are generated from the name. Each commerce step uses `commerce` in place of `interactive`, `media` and `voiceDurationSeconds`.

- A business step uses `{ "kind": "product", "sku": "TV-01" }` for a single product or `{ "kind": "showcase", "sections": [{ "title": "Electronics", "skus": ["TV-01"] }] }` for a grouped offer. A showcase supports up to 10 sections and 30 distinct products.
- A user step uses `{ "kind": "cart", "offerId": "offer" }` to wait for the customer to send a cart from a preceding offer. Set `autoItems` to an array of `{ "sku": "TV-01", "quantity": 2 }` records to configure the automatic cart. Omit the array to select one unit of the first product. Quantities range from 1 to 99.
- A business step uses `{ "kind": "pix", "amount": { "cartId": "cart" } }` for a simulated Pix charge based on a preceding cart. Use `{ "cents": 249900 }` as the amount for a standalone fixed charge. The phone simulates copying the key and briefly shows **Pix key copied**. The journey advances on that tap while the payment stays pending.
- In `getState().messages`, inspect `commerce.kind === "order"` for the actual order lines and `commerce.kind === "pix"` for the resulting charge in cents. Shared links carry the authored catalog and automatic choices. Each playback starts with an empty cart.

```json
{
  "version": 1,
  "contact": { "name": "Demo store", "verified": false },
  "catalog": [
    { "sku": "TV-01", "name": "Smart TV", "description": "55-inch display", "priceCents": 249900 },
    { "sku": "SND-01", "name": "Soundbar", "description": "Compact soundbar", "priceCents": 54900 },
    { "sku": "CBL-01", "name": "HDMI cable", "description": "Two meters", "priceCents": 3990 }
  ],
  "steps": [
    {
      "id": "offer",
      "type": "business",
      "text": "What would you like to order?",
      "delay": 1,
      "commerce": {
        "kind": "showcase",
        "sections": [{ "title": "Electronics", "skus": ["TV-01", "SND-01", "CBL-01"] }]
      }
    },
    {
      "id": "cart",
      "type": "user",
      "text": "",
      "delay": 0.4,
      "commerce": {
        "kind": "cart",
        "offerId": "offer",
        "autoItems": [{ "sku": "CBL-01", "quantity": 2 }]
      }
    },
    {
      "id": "payment",
      "type": "business",
      "text": "Here is your simulated Pix charge.",
      "delay": 1,
      "commerce": { "kind": "pix", "amount": { "cartId": "cart" } }
    }
  ]
}
```
