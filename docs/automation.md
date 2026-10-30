# Automation API v1

WhatsApp Fake Flows exposes `window.whatsappFakeFlows` to tools allowed to execute JavaScript in the current page. This is a browser API, not an HTTP endpoint or MCP server. A tool restricted to read-only JavaScript must use its normal UI controls for mutations.

The `llms.txt` file provides instructions; it does not execute a model or automatically connect an agent. There is no API key, external LLM dependency or server in this integration.

## Discovery and readiness

The page contains `<link rel="describedby">` links and a `whatsapp-fake-flows-api` meta tag. Read `window.whatsappFakeFlows.apiVersion` and `getState().ready`. Wait until the API exists and ready is true before loading a project or starting playback. The `whatsapp-fake-flows:ready` event signals API installation; an initial shared URL may still be loading, so inspect the ready state as well. The event may fire again when the app is remounted.

For a standalone HTML, read `document.getElementById('llms-txt').textContent` or `api.getInstructions()`. No fetch is necessary. In a hosted build, the same folder contains `llms.txt`, `llm.txt` (alias), `llms-full.txt` and the referenced Markdown documentation. When hosting under a subpath, keep these files beside the HTML. The alias and full text are generated; edit the root `llms.txt` and this guide instead.

## Interacting through accessible UI controls

If your tool cannot execute the browser API, use the page's accessible roles and labels. Labels follow the selected interface language (English by default); read the current accessibility tree before acting. User-authored message text is not translated.

- Use the `AI interaction guide (llm.txt)` link in the header to discover these instructions. The language selector is named `Interface language`.
- Scope editing to the `Conversation editor` region, then to the appropriate `Step N` group. Use labeled fields such as `Message text`, `Delay before replying (s)`, `Button text` and `Flow invitation message`. Multiple steps can have identically labeled fields, so do not select globally by position.
- Add steps through the `Add conversation steps` group (`Customer`, `Business`, `Flow`). Re-read the tree after adding, removing or reordering steps; indices and available controls can change.
- Use `Step actions` to move, duplicate or remove a step. For draggable options, use the handle's accessible name and its keyboard instructions rather than screen coordinates.
- Scope preview actions to `Conversation preview`. `Start manually` waits for input; use the `Message` textbox and `Send message` button, or choose the currently visible interactive option. `Play automatically` uses configured answers. These actions run the simulation only.
- Flow forms and option lists open dialogs. Inspect their current headings, labeled fields, required controls and footer buttons before advancing; do not assume every Flow uses the same fields or screen sequence.
- `Copy Link` writes the full journey link to the clipboard. Use it only when requested. Opening the guide does not change the journey.

Prefer semantic roles and labels over CSS selectors or generated IDs. Do not bypass disabled controls. After an action, inspect the updated tree or state to confirm the intended change before continuing.

## API methods

| Member                   | Contract                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `apiVersion`             | Public browser API version, currently 1                                                                                               |
| `projectVersion`         | Persisted JSON version, currently 1                                                                                                   |
| `getInstructions()`      | Embedded index and this guide as text                                                                                                 |
| `getProject()`           | Independent copy of the current project, including local drafts                                                                       |
| `getExample()`           | Independent copy of the default journey with both Flows                                                                               |
| `getState()`             | Independent snapshot of readiness, playback status and rendered messages                                                              |
| `validateProject(input)` | Returns `{valid:true, project}` or `{valid:false, errors:string[]}` without editing anything                                          |
| `loadProject(input)`     | Validates and replaces the entire journey, stops playback, clears the preview and saves locally; returns the normalized project       |
| `createShareURL(input?)` | Promise of a URL carrying the supplied valid project, or the current project if omitted; does not change the address bar or clipboard |
| `play(mode?)`            | Promise of the final playback state; `automatic` by default, or `manual`                                                              |
| `stop()`                 | Cancels playback and pending delays; keeps messages already rendered                                                                  |
| `reset()`                | Stops playback and clears the preview; preserves the configured project                                                               |

`loadProject` rejects invalid input before changing the editor. It is synchronous: after returning, `getProject` reflects the applied journey. Methods throw Error on invalid operations; asynchronous methods reject. `play` rejects while a run is already active, while the initial experience is loading, or when editor fields need correction. Playback errors are reported in the resulting status snapshot.

`play('manual')` waits for human interaction and its promise stays pending until completion or interruption. Use `void api.play('manual')` to start without awaiting. `await api.play('automatic')` fills the configured answers and resolves after the simulation ends. `stop` interrupts either mode.

`getState()` returns:

```ts
{
  ready: boolean,
  running: boolean,
  status: string,
  activeStep: string | null,
  flowScreen: string | null,
  pendingMessageId: string | null,
  messages: ChatMessage[]
}
```

Messages include `id`, `direction` (`user` or `business`), `text` and `time`; interactive messages can include `interactive` and `selection`. The status is human-readable; use the boolean and nullable fields for coordination rather than parsing status strings. Returned objects are copies: change a copy and pass the full project to `loadProject` to apply edits.

## Recommended workflow

1. Inspect `apiVersion`, `getState()` and `getProject()`.
2. Preserve the current project in the tool's working context before replacing it. Modify only the requested parts.
3. Construct a JSON-compatible object using the contract below. Do not pass functions, DOM objects or code strings.
4. Call `validateProject`. Correct reported errors before calling `loadProject`.
5. Call `loadProject` to update the visible editor. It also stops any previous run.
6. Optionally run `play('automatic')` and inspect its final state.
7. Return the result of `createShareURL()` when asked for a link. A file URL only works where that HTML path exists; a stable hosted base URL is needed for cross-computer links.

## Project contract

```ts
{
  version: 1,
  contact: { name: string, avatar: string, verified: boolean },
  steps: Step[]
}
```

`contact` configures the conversation header (usually the business). Use an empty avatar string for no photo or a `data:image/...` URL for a portable uploaded image. Do not use HTTP image URLs. Legacy `assets/` paths remain supported.

Every step has a unique string `id`, `type`, `text` and a numeric `delay` between 0 and 120 seconds. The maximum is 200 steps. Use deterministic IDs when generating a journey. Missing or duplicate step IDs are normalized, but explicit unique IDs make later updates easier.

- `type: 'user'`: user message; automatic mode types `text` and sends it. Manual mode waits for a user to send a message.
- `type: 'business'`: company message; optional `typing` boolean defaults to true. With no `interactive` field it is plain text.
- `type: 'flow'`: a Flow invitation; additionally requires `label`, `flow`, `answers` and optionally `completion` and `typing`.

The sequence is linear. Reply buttons and lists wait for a choice and append that choice as a user response; they do not branch to different steps. Do not add a separate user step just to repeat the selected option.

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

Supported leaf components: TextHeading, TextSubheading, TextBody, TextCaption, RadioButtonsGroup, CheckboxGroup, Dropdown, OptIn, TextInput, TextArea, DatePicker and Footer. Layout containers and If conditions are flattened by the engine. The simulator supports `navigate` to a screen and `complete`; it does not implement server-backed data_exchange or the full Meta API. Unknown components produce a preview error rather than a faithful rendering.

Use ISO dates (YYYY-MM-DD), option IDs for single choice fields, arrays of IDs for checkbox groups, booleans for OptIn and strings for text fields. Expressions reference `${form.field}` and `${data.field}`. Preserve the Meta Flow field names such as `data-source` and `on-click-action`.

## Complete runnable example

Once `api.getState().ready` is true:

```js
const api = window.whatsappFakeFlows;
const previous = api.getProject(); // Keep this copy if the user wants to restore their work.
const journey = {
  version: 1,
  contact: { name: 'Empresa exemplo', avatar: '', verified: false },
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
const shareURL = await api.createShareURL();
```

## Compatibility and contribution

The browser API version and the project version are independent. Preserve the semantics of API v1 methods; introduce a new API version for incompatible changes. New optional project fields can keep project version 1 when existing fields retain their meaning. Keep legacy v1z/v1j shared links readable.

Implementation is in `src/features/automation`. The factory is independent of React; its hook connects validated actions to the editor. Do not expose the internal mutable store or add code evaluation endpoints. Add tests for new actions and keep this guide, the embedded instructions and the API contract consistent.

## Durante uma gravação

A gravação de vídeo é iniciada pelos controles da interface. Enquanto está ativa, `loadProject`, `play`, `stop` e `reset` rejeitam operações que poderiam interromper a captura. Consultas, validação e criação de links continuam disponíveis. Finalize ou cancele a gravação pela interface antes de alterar a jornada pela API. O vídeo não faz parte do projeto JSON nem do link compartilhável.

## Formatação do texto

O campo `text` das etapas aceita `*negrito*`, `_itálico_` e `~tachado~`, inclusive combinados, por exemplo `*_texto_*`. Envie e preserve os marcadores no JSON; o aplicativo os interpreta apenas na apresentação do corpo da mensagem. Não envie HTML para obter estilos. Rótulos de botões e definições de campos do Flow não passam por esse interpretador.
