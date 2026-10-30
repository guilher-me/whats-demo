# WhatsDemo JSON documents

Files use format `whatsdemo`, schemaVersion `1.0.0-alpha.1`, and extension `.whatsdemo.json`. Old links and project files are not imported.

The root contains metadata, participants, resources (assets, flows, templates), journey.steps and playback.userPace. Each step has a stable id, kind message, sender, native-shaped message content, optional resource bindings and simulator-only simulation settings. beforeMs uses integer milliseconds. typingEnabled controls typing indicators. Automatic replies reference IDs; Flow answers are grouped by screen.

Templates store their creation definition separately from the message's template name/language. Current rendering supports literal templates; parameterized templates and unsupported message types are rejected, never silently rendered as another type. Flow definitions remain unmodified native JSON. The editor currently shares values for repeated field names; conflicting per-screen values are rejected until scoped runtime answers are supported.

Uploaded avatars are embedded once as base64 assets, revalidated and rewritten through the existing image-security pipeline. The bundled Luma logo uses an exact allowlisted builtin asset with its embedded source; arbitrary SVG is not accepted. File reads are limited to 8 MiB and nesting to 50 levels. Import validates before showing replacement confirmation; Export current draft preserves the existing work. No remote requests or executable components are imported.

The private editor/playback model is an implementation detail. core/document.ts is the adapter at the file boundary. Future renderers should be registered by message type, not serialized as JavaScript. Unknown schema versions must be explicitly supported before opening.

Automation: getDocument() returns the portable document; loadDocument(document) validates and loads it. These replace createShareURL(). loadProject/getProject remain private-editor-oriented helpers.
