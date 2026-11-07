# Build a journey with an LLM

[← WhatsDemo](../README.md) · [User guide](user-guide.md) · [Automation API](automation.md)

Describe the journey to the AI tool you already use. Give it the [WhatsDemo instructions](../llms.txt), a fictional business, a goal and the steps you want people to test.

> Read the WhatsDemo guide and build a demo for a bike shop called Harbor Cycles. Ask the customer to send an image of a damaged part, offer three simulated images and select the first for automatic playback. Send a simulated estimate PDF from the shop and offer a button to schedule a repair. Use fictional data. Generate a **Test the demo** link and leave my editor draft intact.

An AI with JavaScript execution can use the official link generator. An AI with browser interaction can paste its configuration in **Create with AI** and return the generated link. If your AI only provides text, ask for the journey configuration. Copy the text inside the code block and paste it in **Create with AI** on the WhatsDemo editor. Select **Demo mode** and **Generate link**.

Send the demo link to the people testing the journey. They can interact with it immediately or run automatic playback. **Edit a copy** opens an editable version saved separately in their browser. You can also generate an editor link directly.

Use fictional details because anyone with the link can read the conversation. The site runs locally in the browser and uses your AI tool only through the workflow above. See the [project contract and runnable examples](automation.md).
