# Documentation media

These are real captures of WhatsDemo v0.2.0 using the bundled fictional Luma Home journey, with the English interface at a 1280 × 800 viewport. They do not use a real WhatsApp account or customer data.

| File                 | Content                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `workbench.png`      | The editor and phone after the customer's greeting, with business reply buttons.                         |
| `flow-preview.png`   | The first Flow screen with a lamp, finish and quantity selected.                                         |
| `luma-home-demo.gif` | An 11-frame manual walkthrough: greeting, reply buttons, product list, two-screen Flow and confirmation. |

## Reproduce the scenario

1. Open the current build, select English and restore the example in a disposable demo session. This replaces that session's saved journey.
2. Start manual playback and send `Hi! I’m looking for a new lamp.` in the phone. Sending directly from the idle preview also starts manual playback.
3. Choose **Browse collection**, open **Explore lamps**, select **Beam table lamp** and send the selection.
4. Open **Create a request**. Choose **Beam table lamp · $49**, **Warm sand** and quantity `1`.
5. Continue to the second screen and enter the fictional details **Alex Taylor** and **alex@example.com**. Choose **Collect in store** and send the request.
6. Capture the final confirmation after the configured response delay.

The GIF holds actual UI states for readability; it is not a real-time screen recording. It was encoded with Pillow using a shared 256-color palette, including fixed brand colors, with dithering disabled to keep text sharp. The UI was not changed for capture. Frame durations in milliseconds: `1200, 1700, 1200, 1600, 900, 1400, 1800, 1400, 1400, 1500, 2800`. The screenshots retain their original pixels with lossless PNG compression. Only the final GIF and the two selected PNGs are versioned.

Refresh these assets when the demonstrated UI changes. Keep the default fictional scenario and avoid private names, inboxes or customer details. The screenshots include the project's bundled assets; their sources and notices remain documented in [assets/README.md](../../assets/README.md). The application itself exports phone-only video, not GIF.
