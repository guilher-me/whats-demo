# User guide

[← WhatsDemo](../README.md) · [Install & run](getting-started.md) · [Build with an LLM](ai-guide.md)

## Start a journey

Open the editor to start with an empty conversation or recover a draft saved in this browser. Open a shared link to work with a specific journey. In an editable copy, **Restore from link** replaces local edits in that copy with the journey encoded in its link.

## Build the conversation

The workspace opens with **Code**, **Editor** and **Preview**. Drag a divider to resize adjacent panels. With a divider focused, use Left and Right in the desktop layout or Up and Down when panels are stacked. Use the panel buttons to collapse or reopen a panel while retaining its content.

**Code** shows the entire journey as JSON. Paste or edit a draft there, use **Validate** to check it, and select **Apply** to update the editor and phone. **Copy JSON** copies the text on screen. If the visual editor changes while a code draft is pending, reload the current project before applying. The diagnostics distinguish Flow JSON rules, simulator support and missing automatic answers. Missing automatic answers leave manual playback available.

1. Set the **contact name** and choose whether to display the **verified account badge**.
2. Add a **Customer**, **Business** or **Flow** step from the fixed bar at the bottom of the editor. New steps go at the end and receive focus.
3. Expand a step to edit it. Select a step or focus one of its fields to see the message update in the phone.
4. Open **Behavior** to set the delay and, for business replies, the typing indicator.
5. Reorder steps with the drag handle or keyboard. Use the step action menu to duplicate, move or remove a step.

The header status describes saving for the **entire project**, including contact details and the conversation. Hover or focus it for details. Changes are stored in the current browser, not in an online account. Clearing browser storage removes that local draft.

## Messages, buttons and lists

For a customer voice note, choose **Voice message (mock)** under **Format**. Set **Recording duration** from 1 to 120 seconds for automatic playback. While recording, the composer shows the elapsed time. In manual playback, hold the microphone and release it to send, or slide left to cancel. The sent voice bubble shows a simulated waveform and the recorded duration. The entire interaction is silent.

For text-based Business messages, choose one of these formats.

| Format       | Use it for                                                               | Limits                                                                                                     |
| ------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Plain text   | Greetings, explanations and confirmations.                               | Use the editor's text fields.                                                                              |
| Buttons      | Quick replies, website links, phone calls, copy codes or WhatsApp calls. | Choose Interactive message or Template message; see [button rules](messages.md#button-types-and-contexts). |
| Options list | Products or services grouped into sections.                              | Up to 10 options across the sections.                                                                      |

Set optional headers, footers and automatic answers in the message's additional settings. In manual mode, choosing a quick reply or confirming a list records the customer's response and advances the journey. Action buttons show a simulation inside the phone; they do not open websites, call numbers or copy to the clipboard. Select **Continue demo** to confirm an action. Mixed templates still wait for a quick reply. Option drag handles let you change their order.

Message bodies support `*bold*`, `_italic_` and `~strikethrough~`, including combinations such as `*_bold italic_*`. Formatting appears in previews, playback and recordings. Unmatched markers remain literal; message text is not rendered as HTML.

## Add simulated attachments

Set a Customer or Business message to **Image** or **Document**. Choose a file extension directly in the step. Images offer .png and .jpg, with optional short text on the preview and a separate message caption. For a document, enter the name, a positive size and its unit. The editor adds the selected extension to the name and enforces the WhatsApp Business document limit of 100 MB (100,000 KB). [WhatsApp Business media limits](https://docs.aws.amazon.com/social-messaging/latest/userguide/supported-media-types.html)

The gallery and document picker show matching simulated files from the conversation. In manual playback, use the paperclip to choose an item and send it. Automatic playback selects the item configured on the step.

## Add a WhatsApp Flow

A Flow step combines a business invitation, an opening button, a Flow JSON definition, automatic answers and an optional customer completion message.

- **Form structure** opens on **Visual**. Select a screen to see it in the phone. Add or reorder components, then set the final button to **Next screen** or **Complete**. Connect a new screen by selecting it as the destination of an earlier screen's button.
- **JSON** edits just the Flow definition. Valid edits update Visual and Preview immediately. Invalid edits stay in the step as a draft while the phone shows the previous valid version. Edit conditions, bindings and payloads in JSON.
- **Test Flow** opens the first screen in the phone. Navigate, go back, complete and restart with test values kept in the preview session.
- **Automatic answers** tell automatic playback what to enter and select.
- In manual mode, open the invitation and fill the form yourself. Required fields must be completed before moving on.

An invalid JSON draft or unsupported component produces validation feedback. Fix errors before playing or sharing. The [Meta Flows Playground](https://developers.facebook.com/documentation/business-messaging/whatsapp/flows/playground) is also linked from the app header for reference; WhatsDemo does not publish Flows to Meta.

## Preview and play

### Preview while editing

Select a step to see its current message, buttons, list or Flow invitation. You can open the form in this preview without starting the journey.

Use **View conversation** to inspect all configured messages in order without waiting for delays. This static overview includes configured automatic button/list responses and Flow completions using their automatic answers. It remains separate from playback history.

### Manual playback

Type in the phone's message field and press **Enter** or click **Send** to start manual playback. Your text replaces a configured opening customer text step. If the journey starts with a business step, your message appears before it and all configured steps remain. If it starts with a simulated voice step, hold the microphone to start. For an opening attachment step, use the paperclip. These actions leave the saved configuration intact.

You can also select **Start manually**. Later customer steps wait for a reply; buttons, lists and Flows wait for your interaction.

### Automatic playback

Select **Play automatically** to run the configured journey with an animated cursor and automatic form answers. The simulated-user pace control runs from 0.5× to 3×: it adjusts reading, typing and clicks, while preserving configured business delays and system transitions. Flows are read and filled field by field.

The composer is disabled during automatic playback. Use the pause button to suspend the journey; it becomes Resume and continues from the same point. After it finishes, sending a message can start a new manual conversation. Controls beside the phone let you pause, resume and reset the preview; resetting playback does not delete the configured journey.

## Share a demo

Select **Copy link** to copy the link in the current interface language. The link opens a browser-local copy with only **Preview** expanded. Recipients can play the journey immediately or expand **Code** and **Editor** to edit their copy.

An AI tool with browser access can build the journey in the editor and copy the result. See [the AI guide](ai-guide.md).

The link holds the compressed journey, including messages, Flow definitions, automatic answers and simulated attachment labels. Anyone with the full URL can read the content. Use fictional data and a hosted address your recipients can reach. Links copied from a local HTML file target the public WhatsDemo site.

Invalid or truncated links open a recovery screen with a shortcut to the local editor. Your stored draft remains available.

## Record a phone-only video

Select **Record phone**, choose manual or automatic playback, and wait for the three-second countdown. In manual mode, stop the recording yourself. In automatic mode, recording finishes two seconds after the last message.

The download is MP4 where supported, otherwise WebM. Recording captures only the phone, without audio, at 720 × 1440; the editor and controls stay out of the video. Keep the tab visible while recording. Rendering happens locally. See the [recording reference](recording.md) for implementation details and limitations (currently in Brazilian Portuguese).

The recording in the project README is an MP4 demonstration supplied by the maintainer. The app's recording feature exports video, not GIF.

## Interface languages

Choose a round flag in the header for **English**, **Spanish** or **Brazilian Portuguese**. English is the default. The preference is stored in the current browser.

Changing the interface language does not translate your message text or Flow JSON.

## Scope and limitations

- WhatsDemo is an independent simulator, not a connected WhatsApp inbox or Meta publishing tool.
- Conversation steps execute in sequence. A button or list choice does not branch to a different sequence of messages. Flow screen navigation and supported conditional components work within the form.
- The Flow renderer implements a subset of Meta's components. Do not treat a successful simulation as production API validation.
- Local drafts are browser-specific. Experience links carry readable project data and depend on a reachable app address.
- Browser support affects video recording and link compression. The app reports unsupported operations instead of requiring a backend.

For problems, [open an issue](https://github.com/guilher-me/whats-demo/issues) with a small fictional journey and steps to reproduce it.

## Simulated locations

Choose **Location** as the format of a customer or business message. Set a fictional place name and, optionally, an address. The phone shows an illustrated map and opens its details inside the demo.

In manual playback, use **Attach → Location**. **Send my current location** uses the point from the active step. You can also choose another place from the demo. Automatic playback sends the point configured for the step.

## Catalog, cart and Pix

Open **Product catalog** in the editor and add fictional products with a SKU, name, description and price in BRL cents. The app generates a simulated thumbnail. In a business message, choose **Product** or **Product showcase**. Add a customer **Send cart** step and link it to the offer. Set quantities in **Automatic cart**. By default, automatic playback picks one unit of the first product.

In the Preview, open the offer, add products and review quantities in **View cart**. Sending the cart creates a customer message with its subtotal. Closing the offer or cart keeps the selection until you send it, stop or restart the demo.

In a business **Pix Copy and Paste** step, select a fixed amount or use the subtotal from an earlier cart. The linked total follows the selection made during playback. **Copy Pix code** briefly shows **Pix key copied** and advances the conversation. The demo simulates copying and the charge stays pending.
