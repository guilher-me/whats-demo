# Automation API v2

WhatsApp Fake Flows exposes `window.whatsappFakeFlows` to tools allowed to execute JavaScript in the current page. This is a browser API, not an HTTP endpoint or MCP server. A tool restricted to read-only JavaScript must use its normal UI controls for mutations.

The `llms.txt` file provides instructions; it does not execute a model or automatically connect an agent. There is no API key, external LLM dependency or server in this integration.

## Generate links from an AI tool

Construct a JSON-compatible project using the contract below. Configure it in the editor through the public API or visible controls. Return an editor link by default, and use preview mode when the user wants only the interactive phone.

- **Browser API** — validate the configuration, then call `window.whatsappFakeFlows.loadProject(project)` when the user authorizes replacing the active draft. Generate a link with `await window.whatsappFakeFlows.createShareURL(project)`. Pass `'demo'` as the second argument to open the preview.
- **Browser controls** — paste the whole journey in **Code**, use **Validate** and **Apply**, then select **Copy link** and choose **Editor** or **Preview**. The link is copied immediately using the current interface language.
- **Static module** — the hosted build publishes `share.mjs` beside the app. It exports `createShareURL(project, mode?, baseURL?, locale?)`. The default opens the production editor. Pass a reachable app address and `'en'`, `'es'` or `'pt-BR'` as needed.

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

In browser controls, scope editing to **Conversation editor** and expand a step through **Edit step N**. Use **Choose an attachment** in an image or document step to create a preview or reuse one from another step. A Customer step can **Add a manual choice**. In **Conversation preview**, use **Start manually** or **Play automatically**. Follow the accessible labels in the selected interface language.

## Project contract

```ts
{
  version: 1,
  contact: { name: string, verified: boolean },
  attachments?: Attachment[],
  steps: Step[]
}
```

The fixed store icon is included with the app. Set the contact name and whether the verified badge should appear. The [JSON schema](../schemas/project-v1.schema.json) describes the structure. The generator also checks cross-references and message rules.

Every step has a unique string `id`, `type`, `text` and a numeric `delay` between 0 and 120 seconds. The maximum is 200 steps. Use deterministic IDs when generating a journey. Missing or duplicate step IDs are normalized, but explicit unique IDs make later updates easier.

- `type: 'user'`: user message; automatic mode types `text` and sends it. Manual mode waits for a user to send a message.
- A customer step with `voiceDurationSeconds` uses the simulated voice composer. Set `text` to `''` and use an integer from 1 to 120. Automatic playback holds the microphone for that many seconds after moving the simulated cursor to it. Manual playback uses the actual hold time. A sent voice bubble has `voiceDurationMs` in `getState().messages`.
- `type: 'business'`: company message; optional `typing` boolean defaults to true. With no `interactive` field it is plain text.
- `type: 'flow'`: a Flow invitation; additionally requires `label`, `flow`, `answers` and optionally `completion` and `typing`.

The sequence is linear. Reply buttons and lists wait for a choice and append that choice as a user response; they do not branch to different steps. Do not add a separate user step just to repeat the selected option.

## Simulated attachments

List each attachment once in `attachments`. An image uses `{ id, kind: 'image', name }`, for example `IMG 01`. A document uses `{ id, kind: 'document', name, sizeLabel }`, such as `Estimate.pdf` and `240 KB`. Use up to 50 attachments with unique IDs of letters, digits, underscores or hyphens. Names, sizes and captions are plain text.

Set `media: { kind, attachmentId, caption? }` on a Customer or Business step. The referenced item must match the kind. Use `text: ''` for media and keep the image caption on its step. A Customer media step can include `alternativeIds` of the same kind for extra manual choices. The phone's picker contains all items referenced by any step, including later steps and alternatives, once per ID. Automatic playback uses the primary `attachmentId`. Omit media sources, document covers and avatars.

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

A Flow step's `flow` field contains the JSON definition, not a Flow URL. `answers` maps form field names to values used in automatic mode. Supply an answer for every required field reached by the chosen route.

Supported leaf components: TextHeading, TextSubheading, TextBody, TextCaption, RadioButtonsGroup, CheckboxGroup, Dropdown, OptIn, TextInput, TextArea, DatePicker and Footer. Layout containers and If conditions are flattened by the engine. The simulator supports `navigate` to a screen and `complete`; it does not implement server-backed data_exchange or the full Meta API. The local diagnostics report Flow JSON issues and simulator coverage. A missing required answer on the configured route is shown before automatic playback, while manual playback remains available. The Meta Playground is available for comparison.

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
api.loadProject(validation.project);
const result = await api.play('automatic');
const shareURL = await api.createShareURL(journey, 'demo');
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
  attachments: [
    { id: 'photo', kind: 'image', name: 'IMG 01' },
    { id: 'photo-2', kind: 'image', name: 'IMG 02' },
    { id: 'estimate', kind: 'document', name: 'Estimate.pdf', sizeLabel: '240 KB' },
  ],
  steps: [
    {
      id: 'photo',
      type: 'user',
      text: '',
      delay: 0,
      media: {
        kind: 'image',
        attachmentId: 'photo',
        alternativeIds: ['photo-2'],
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
        attachmentId: 'estimate',
      },
    },
  ],
};
console.log(await createShareURL(project, 'demo'));
```

## Compatibility and contribution

API v2 uses `createShareURL` and `loadProject` for simulated attachments. Existing `#project=v1z…` and `#project=v1j…` links open as demos. Legacy drafts and links keep attachment names and valid step references. Old image bytes and custom avatars are discarded on recovery. Invalid links leave the local draft intact.

The implementation uses the same codec and project validation in the app, public module and browser API. Add tests for contract changes and update the schema and instructions together.

## Durante uma gravação

A gravação de vídeo é iniciada pelos controles da interface. Enquanto está ativa, `loadProject`, `play`, `stop` e `reset` rejeitam operações que poderiam interromper a captura. Consultas, validação e criação de links continuam disponíveis. Finalize ou cancele a gravação pela interface antes de alterar a jornada pela API. O link carrega somente a configuração da jornada.

## Formatação do texto

O campo `text` das etapas aceita `*negrito*`, `_itálico_` e `~tachado~`, inclusive combinados, por exemplo `*_texto_*`. Envie e preserve os marcadores no JSON; o aplicativo os interpreta apenas na apresentação do corpo da mensagem. Não envie HTML para obter estilos. Rótulos de botões e definições de campos do Flow não passam por esse interpretador.

## Typed message buttons

For `interactive.kind: "buttons"`, set optional `context` to `"interactive"` (default) or `"template"`. Each button has `id`, `title` and optional `type`: `"quick_reply"` (default), `"url"` with `url`, `"phone_number"` with `phoneNumber`, `"copy_code"` with `code`, or `"voice_call"` with optional integer `ttlMinutes`. See [message rules](messages.md#button-types-and-contexts) before combining types. In mixed templates, `autoReplyId` must target a quick reply; action-only messages may target an action. Action buttons open a phone-contained simulation, not an external site/call/clipboard operation. UI selects are labeled `Message context` and `Button type`; URL, phone, code and TTL fields appear for the chosen type. More than three template buttons use `See all options`.
