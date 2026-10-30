# Interface palette

The application chrome uses a neutral light palette. The editor is an almost-white surface, cards are white, and the preview has a slightly darker cool-gray canvas so the phone stays the focal point. Emerald is reserved for primary actions, focus and selection; red identifies recording and errors. The WhatsApp conversation renderer retains its own native colors and wallpaper.

Shared values live in `src/styles/tokens.css`:

| Token               | Value     | Purpose                       |
| ------------------- | --------- | ----------------------------- |
| `--ink`             | `#182230` | Primary text                  |
| `--muted`           | `#5F6B7A` | Secondary copy and hints      |
| `--surface`         | `#FFFFFF` | Cards, fields and header      |
| `--surface-editor`  | `#F7F8FA` | Editor canvas                 |
| `--surface-preview` | `#E9EDF3` | Phone preview canvas          |
| `--line`            | `#DFE4EB` | Dividers and borders          |
| `--accent`          | `#007F68` | Primary actions and selection |
| `--accent-soft`     | `#EAF5F1` | Accent hover surfaces         |
| `--danger`          | `#B42318` | Recording and errors          |

Use semantic tokens in new application controls instead of adding more near-identical hex colors. Keep phone-specific colors in the conversation/Flow styles so brand changes to the editor do not recolor simulated customer messages. Card and floating-control shadows use neutral ink rather than green.
