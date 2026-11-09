# Changelog

Notable changes to WhatsDemo are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

The 0.2.0 entry documents the production baseline as of 2026-11-08. Earlier deployments used the same version.

## [Unreleased]

### Added

- Navigate between a step in the Editor and its JSON block in Code.
- Insert automatic variables from chat replies, choices, completed Flows and simulated locations.

## [0.5.0] - 2026-11-08

### Added

- Point first-time shared preview visitors to automatic playback with an animated hint.
- Add a subtle repeating doodle to the preview background.
- Download phone recordings as animated GIFs, with transparent corners when enabled for the recording.

### Changed

- Document the current workspace, message and recording features in the WhatsDemo agent guide.
- Use `window.whatsDemo` and `whatsdemo:ready` for browser automation API v4. The previous global and ready event were removed.

### Fixed

- Keep product offer buttons at full contrast while playback temporarily locks them.
- Stabilize colors across frames in phone recording GIFs.
- Match the GIF export progress bar to the active theme.

## [0.4.0] - 2026-11-08

### Added

- Create and reopen journeys in a local library, with a live address for each shareable edit.
- Copy a link, rename, or delete any journey directly from the library.
- Choose the business icon color independently with presets, a visual color picker, or automatic contrast.
- Record the phone with transparent corners for presentations that support WebM alpha.

### Changed

- Keep the save indicator steady while editing and confirm after a short pause.
- Choose from 40 business icons and preview background colors in an avatar dialog before applying.
- Prevent accidental text selection in the interface while keeping fields, JSON and diagnostics copyable.

### Fixed

- Keep location choices and sent attachment previews at full opacity during automatic playback.
- Keep phone recording timestamps running and hold the last frame before finalizing the video.
- Configure automatic cart quantities from the product showcase editor.
- Keep available product and cart controls at full contrast during automatic playback.
- Keep phone control tooltip titles legible in dark mode.
- Use the same circular playback speed slider in both themes.
- Capture smoother automatic cursor movement in phone videos.

## [0.3.0] - 2026-11-08

### Added

- Open the release history from the version badge in the editor and shared demos.
- Switch between light and dark across the editor, shared demos, WhatsApp Flows and phone recordings.
- Turn on optional Christmas snowfall from the header.

### Changed

- Give the phone a black rim and a more natural shadow on a matte teal background.
- Leave more room around the phone in the preview while keeping the video at 720 × 1440.

## [0.2.0] - 2026-11-08

### Added

- Build and share editable journeys with simulated messages, images, documents, locations, voice notes and commerce.
- Design static WhatsApp Flows in synchronized Visual and JSON tabs and test them in the phone.
- Reorder steps, edit journey JSON and resize or collapse the Code, Editor and Preview panels.
- Customize the company icon and record the phone as a local video.

### Changed

- Shared links open with the Preview expanded in the selected language.
- The phone shows a local clock, centered camera and side buttons. Voice recording shows a timer before the sent waveform.

### Removed

- Browser automation API v3 removes the bundled example. The editor starts with an empty journey.
