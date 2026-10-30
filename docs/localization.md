# Interface languages

WhatsDemo supports English (`en`, default), Spanish (`es`) and Brazilian Portuguese (`pt-BR`). A horizontal flag selector in the header updates the interface immediately, including accessible names, dialogs, tooltips, validation and phone controls. Each flag button has a native-language name, `lang`, keyboard focus and `aria-pressed`; flags are decorative within those labeled buttons.

The preference is stored separately in `whatsdemo-locale`. Missing, invalid or unavailable storage falls back to English. The app does not infer a language from the device. `document.documentElement.lang` follows the selected language. The selector is disabled during recording to keep a consistent video.

## Components and catalogs

The project uses i18next and react-i18next. `src/i18n/index.ts` initializes the local catalogs and exports `useT`, `t`, `Locale` and `MessageKey`. All catalogs are bundled into the portable HTML, including flag assets; no translation service or CDN is contacted.

Reusable React components call `const t = useT()` and render semantic keys such as `t('editor.title')`. The hook subscribes the component to language changes, even when used outside App. Pure validators and event handlers import `t` directly. Keys are type-checked against the English catalog. Use interpolation parameters for dynamic text; let React render the returned strings. Do not use HTML injection or translate DOM nodes.

Add or update a key in **all three** `src/i18n/locales/*.json` files. Keep key names independent of the visible wording so translations can evolve without changing component APIs. Prefer a full sentence with placeholders over string concatenation. Use i18next plural forms for counts. Stored UI status uses a key and values, translated on render, rather than freezing the language at the time of an action.

## Journey content is independent

Switching interface language does not rewrite contact names, messages, option labels, Flow JSON or automatic answers. Existing examples retain their authored language. Newly created blank components use localized seed text, which becomes editable project content. The project schema, legacy links, storage key and automation method names stay unchanged; language preference is not included in shared links. Automation status text is localized presentation; use structured fields such as `running`, `activeStep` and `pendingMessageId` for logic.

## Flags and validation

The USA, Spain and Brazil circular SVGs come from [Circle Flags by HatScripts](https://github.com/HatScripts/circle-flags), under MIT. Their original license lives at `assets/flags/LICENSE.md` and is included in the portable HTML notices. Native language names remain the authoritative accessible labels.

Run `npm test` for catalog parity, interpolation placeholders, all three language interfaces, persistence fallback, accessible controls, validation, playback continuity and preservation of shared journey links. Existing behavior tests explicitly use pt-BR fixtures; localization tests select each language separately.
