# Build a journey with an LLM

[← WhatsDemo](../README.md) · [User guide](user-guide.md) · [Automation API](automation.md)

Describe the journey to the AI tool you already use. Give it the [WhatsDemo instructions](../llms.txt), a fictional business, a goal and the steps you want people to test.

> Read the WhatsDemo guide and build a demo for a bike shop called Harbor Cycles. Ask the customer to send a simulated photo of a damaged part. Send a simulated estimate PDF and use a Flow to collect the customer’s name and preferred repair date. Include fictional automatic answers for the Flow. Use fictional data. Generate a **Test the demo** link and leave my editor draft intact.

Give a browser-capable AI tool the WhatsDemo editor URL. It can validate the whole JSON in **Code** or through the public API. Authorize **Apply** or `loadProject` only when you want to replace the active draft. To keep your draft intact, ask for a link generated directly from the project and test the link in its own tab.

**Copy link** opens a browser-local copy with only **Preview** expanded and carries the selected interface language. Expand **Code** or **Editor** to edit the copy. An AI tool can also generate a standalone demo link through the public API or the static generator without loading the journey into your editor.

Use fictional details because anyone with the link can read the conversation. The site runs locally in the browser and uses your AI tool only through the workflow above. See the [project contract and runnable examples](automation.md).
