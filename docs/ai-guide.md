# Build a journey with an LLM

[← WhatsDemo](../README.md) · [User guide](user-guide.md) · [Automation API](automation.md)

Describe the experience you want to demonstrate, then let an AI tool help assemble the journey in WhatsDemo. The app provides a discoverable guide, accessible controls and a versioned browser API.

There is no built-in model connection, API key field or hosted AI service. Your chosen tool must be able to read the app and interact with it, subject to its own permissions.

## Give your tool the right instructions

1. Open WhatsDemo in a browser your tool can access.
2. Point the tool to the **llms.txt** link in the header. On a hosted installation, the guide is also available beside the HTML at `llms.txt`; the full guide is at `llms-full.txt`.
3. Describe the fictional business, goal, desired steps and automatic answers. Say whether the tool may replace the current journey.
4. Have the tool validate the project and test the result before sharing a link.

Example prompt:

> In this WhatsDemo tab, read the llms.txt guide first. You may replace the current journey with a new fictional demo for a bike shop called Harbor Cycles. Use English. Include a customer greeting, a business reply with two buttons, a service options list, a short appointment Flow and a final confirmation. Keep it under eight steps. Use fictional customer details and provide valid automatic answers. Validate it, preview it, and give me the experience link. Do not publish anything externally.

## Two ways tools can interact

| Tool capability                             | Recommended approach                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Accessible browser interaction              | Use the editor's named regions, buttons, fields and option menus. Read the current UI language and accessibility tree before acting. |
| Authorized JavaScript execution in the page | Use `window.whatsappFakeFlows` rather than React internals or direct localStorage writes.                                            |

For API tools, the normal workflow is: check readiness, read the current project, construct JSON-compatible data, validate it, load it, then play or create a share URL. `getInstructions()` returns the embedded guide, including in the portable HTML.

The guide describes capabilities; it does not grant permission to overwrite user work or transmit data. A read-only tool must use its permitted UI interactions for changes instead of bypassing that restriction.

## Use the versioned contract

The browser API is **version 1**. The persisted project format is also **version 1**. Method names retain the original `whatsappFakeFlows` namespace for compatibility with existing tools and saved links.

The [Automation API reference](automation.md) contains exact method signatures, project fields, complete examples, readiness rules, error handling and supported Flow components. Use that contract instead of guessing a schema from screenshots.

For hosting, publish the full `dist/` directory so the guide and referenced documents are reachable. The standalone HTML embeds the instructions and opens them through its header link without fetching a separate file.
