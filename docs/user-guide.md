# User guide

[← WhatsDemo](../README.md) · [Install & run](getting-started.md) · [Build with an LLM](ai-guide.md)

## Start with a working example

The built-in **Luma Home** journey is an English-language demo for a fictional lighting store. It includes reply buttons, a sectioned product list, a two-screen Flow and a request confirmation. Customer details are fictional.

Use **Restore example** to load it. The app asks you to confirm before replacing the current journey; copy its experience link first if you want to keep it. Existing drafts and shared links do not automatically get replaced when the built-in example changes.

## Build the conversation

The left panel is the editor; the right panel is the phone preview.

1. Set the **contact name**, upload a profile photo and choose whether to display the **verified account badge**.
2. Add a **Customer**, **Business** or **Flow** step from the fixed bar at the bottom of the editor. New steps go at the end and receive focus.
3. Expand a step to edit it. Select a step or focus one of its fields to see the message update in the phone.
4. Open **Behavior** to set the delay and, for business replies, the typing indicator.
5. Reorder steps with the drag handle or keyboard. Use the step action menu to duplicate, move or remove a step.

The header status describes saving for the **entire project**, including contact details and the conversation. Hover or focus it for details. Changes are stored in the current browser, not in an online account. Clearing browser storage removes that local draft.

Profile photos accept PNG, JPEG and WebP up to 2 MiB, 4096 pixels per edge and 8 million pixels. They are validated and rewritten locally before display and sharing. See [image security](IMAGE-SECURITY.md).

## Messages, buttons and lists

Business messages support three formats:

| Format        | Use it for                                  | Limits                                      |
| ------------- | ------------------------------------------- | ------------------------------------------- |
| Plain text    | Greetings, explanations and confirmations.  | Use the editor's text fields.               |
| Reply buttons | A short set of clear choices.               | 1–3 buttons, up to 20 characters per title. |
| Options list  | Products or services grouped into sections. | Up to 10 options across the sections.       |

Set optional headers, footers and automatic answers in the message's additional settings. In manual mode, choosing a button or confirming a list records the customer's response and advances the journey. Option drag handles let you change their order.

Message bodies support `*bold*`, `_italic_` and `~strikethrough~`, including combinations such as `*_bold italic_*`. Formatting appears in previews, playback and recordings. Unmatched markers remain literal; message text is not rendered as HTML.

## Add a WhatsApp Flow

A Flow step combines a business invitation, an opening button, a Flow JSON definition, automatic answers and an optional customer completion message.

- **Form structure** contains the advanced JSON editor. The renderer supports a subset of WhatsApp Flow components, including screen navigation and conditional fields.
- **Automatic answers** tell automatic playback what to enter and select.
- In manual mode, open the invitation and fill the form yourself. Required fields must be completed before moving on.

An invalid JSON draft or unsupported component produces validation feedback. Fix errors before playing or sharing. The [Meta Flows Playground](https://developers.facebook.com/documentation/business-messaging/whatsapp/flows/playground) is also linked from the app header for reference; WhatsDemo does not publish Flows to Meta.

## Preview and play

### Preview while editing

Select a step to see its current message, buttons, list or Flow invitation. You can open the form in this preview without starting the journey.

Use **View conversation** to inspect all configured messages in order without waiting for delays. This static overview includes configured automatic button/list responses and Flow completions using their automatic answers. It remains separate from playback history.

### Manual playback

Type in the phone's message field and press **Enter** or click **Send**. This starts manual playback automatically. Your text replaces only a configured opening customer step. If the journey starts with a business step, your message appears before it and all configured steps remain. The saved configuration is unchanged.

You can also select **Start manually**. Later customer steps wait for a reply; buttons, lists and Flows wait for your interaction. The **Phone only** view gives the conversation more space and starts manual playback if needed.

### Automatic playback

Select **Play automatically** to run the configured journey with an animated cursor and automatic form answers. The simulated-user pace control runs from 0.5× to 3×: it adjusts reading, typing and clicks, while preserving configured business delays and system transitions. Flows are read and filled field by field.

The composer is disabled during automatic playback. Stop playback to take over. After it finishes, sending a message can start a new manual conversation. Controls beside the phone let you stop and reset the preview; resetting playback does not delete the configured journey.

## Share a demo

**Copy Link** encodes a snapshot of the current project in the URL fragment. It includes contact details, photo, messages, Flow definitions and automatic answers. There is no project database.

- On a hosted installation, recipients need access to the same app address.
- A `file://` link depends on the app existing at the same path on the recipient's machine. Share the HTML too, or host the build.
- Sharing the HTML alone distributes the app and its built-in example; it does not include your current local draft.
- Anyone with the full experience link can read the encoded data. Use fictional details. The link is not encrypted storage.

The format keeps support for older `v1z` and `v1j` links. Invalid or unsupported contact photos are replaced by the fallback avatar without discarding the journey.

## Record a phone-only video

Select **Record phone**, choose manual or automatic playback, and wait for the three-second countdown. In manual mode, stop the recording yourself. In automatic mode, recording finishes two seconds after the last message.

The download is MP4 where supported, otherwise WebM. Recording captures only the phone, without audio, at 720 × 1280; the editor and controls stay out of the video. Keep the tab visible while recording. Rendering happens locally. See the [recording reference](recording.md) for implementation details and limitations (currently in Brazilian Portuguese).

The recording in the project README is an MP4 demonstration supplied by the maintainer. The app's recording feature exports video, not GIF.

## Interface languages

Choose a round flag in the header for **English**, **Spanish** or **Brazilian Portuguese**. English is the default. The preference is stored in the current browser.

Changing the interface language does not translate your message text or Flow JSON.

## Scope and limitations

- WhatsDemo is an independent simulator, not a connected WhatsApp inbox or Meta publishing tool.
- Conversation steps execute in sequence. A button or list choice does not branch to a different sequence of messages. Flow screen navigation and supported conditional components work within the form.
- The Flow renderer implements a subset of Meta's components. Do not treat a successful simulation as production API validation.
- Local drafts are browser-specific. Experience links carry readable project data and depend on a reachable app address.
- Browser support affects video recording and image processing. The app reports unsupported operations instead of requiring a backend.

For problems, [open an issue](https://github.com/guilher-me/whats-demo/issues) with a small fictional journey and steps to reproduce it.
