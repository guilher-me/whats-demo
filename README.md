# WhatsDemo

<p align="center">
  <img src="assets/whatsdemo-logo.svg" alt="WhatsDemo" width="260" />
</p>

**Build and share an interactive WhatsApp journey before building the integration.** Compose the conversation, try it manually or play it automatically in the phone preview, then share a link people can open and explore. WhatsDemo runs in the browser, without a backend or WhatsApp account.

<p align="center">
  <a href="https://github.com/guilher-me/whats-demo/actions/workflows/ci.yml"><img src="https://github.com/guilher-me/whats-demo/actions/workflows/ci.yml/badge.svg" alt="CI build and tests" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-00816b" alt="License: MIT" /></a>
  <a href="package.json"><img src="https://img.shields.io/github/package-json/v/guilher-me/whats-demo?color=123f3b" alt="Project version" /></a>
  <a href="docs/getting-started.md"><img src="https://img.shields.io/badge/backend-not%20required-00816b" alt="No backend required" /></a>
  <a href="docs/user-guide.md#interface-languages"><img src="https://img.shields.io/badge/languages-EN%20%7C%20ES%20%7C%20PT--BR-123f3b" alt="Interface languages: English, Spanish and Brazilian Portuguese" /></a>
</p>

[Open WhatsDemo](https://guilher-me.github.io/whats-demo/) · [Watch a walkthrough](docs/media/README.md#luma-home-walkthrough) · [Changelog](CHANGELOG.md)

## What you can demo

| Demo                                               | What the customer can try                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| [Magazine Luzia][magazine-luzia] · Retail checkout | Browse products, send a cart and see a simulated Pix charge for the order. |
| [OdontoNext][odontonext] · Dental booking          | Complete a WhatsApp Flow and receive a personalized confirmation.          |
| [iReplace][ireplace] · Repair intake               | Choose a problem, send a simulated photo and get a location card.          |
| [CatLove][catlove] · Pet delivery                  | Reply to a delivery update template and send a simulated voice note.       |
| [NuBolso][nubolso] · Banking self-service          | Choose a statement period and open a simulated PDF.                        |

Use the visual editor or journey JSON to build a scenario. Save it in your browser, share it as a link, or export a phone-only video or GIF. Use fictional data in shared journeys.

## Documentation

- [Get started](docs/getting-started.md) for local setup and the portable HTML build.
- [User guide](docs/user-guide.md) for editing, playback, sharing and recording.
- [Build with an LLM](docs/ai-guide.md) and [Automation API](docs/automation.md) for the journey schema, validation and link generation.
- [Architecture](docs/architecture.md) and [Deployment](docs/deployment.md) for project internals and the GitHub Pages workflow.
- [Contributing](CONTRIBUTING.md) · [Report an issue](https://github.com/guilher-me/whats-demo/issues) · [MIT license](LICENSE)

WhatsDemo is an independent simulator for fictional conversations.

[magazine-luzia]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEuAVNiYBvCvYypnYCplIsIAt0qPMBsfHvkfbwFnLtbQe2hDyB1yGk4T6uHrrVocxgkrdwudr3ko6WfM5DbvblXPqpBAZlQ3bIVYseW4W7eKsKGvwfvmfil01HC6MZwcVZfIo7ewTtxU7SNs9nPQUC8qwA5rzG1aYdKspEGjyKjoAXwwQXohdcDV0hqGIXJqEPlQapsian3pSkSzhAI9Skn5YLoaFR8eqMDVWmRwBWNaZuTBeAWjMAsho0Jyjncxgp6uibCeaoZHyUHI5yTXjkhX6lrp92INFPizcHsoDeTocQgxWUDiKuwKXxdfahGaMIpb6JVTyoPwgLg9mWugdRqlNjOxv6YcZp8NGMxFmYa7Qaqy4snvCuGjkyVScTQrjMog2lqIYzBrGrpJI9zTCiFwHrzGE7sk9GeUTwqqrgOdQ9cd2mrQpqnzDTFVYYUsIk5v5et3fdB4iWfoRb1a2NcowfbuiWz6Q43yXyljkETAOLwkWlQMIhnSHmBoEEBzqh0VXSrIHt5vBlvF3AtIPwBeyfVkqN3fQV4XtvjXA8L1qqeEONtsw1spB748ycPwQYvXZEgqY6O2oYKOhwOVxA1zeo2vPnGR8cT4xEmzt8Lf5Is83ZiL5s66FxsYbPap4YzZgJFvifdtS5T5srLKxodGOpFEb3XxRoMdn1gSHSBsstzILPT0jw6m8qaQ5D73AAy3LLj1OlF6vMMOdCmzoElm03LZs4mc2UQrVf3qMLjiHMCbaO0an1XsmktjPaxfdy3QZtwN1tjKnWYP4mbNKPYZ5915FCS9kn3RXSGXyDsYIbNn0PbZP5VS7FoHv&lang=en
[odontonext]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbFLYFLyKlPcQ4zYZuGxdHooZxPsjjn1MzypBaFXygdmauz5QvdbauSseitOGC18UhVaY6lmp0x8xfLBB6Gkx5OdX1An81RhjHFn8ITvQ5feCAEXzpwohuJeJUFPG0vZ53d8YWb158RnmdvY6zZL1dob8LbUIum92kYv9hGKXjNVdksA6OoW6V22REU81S6t4uBZiuTpnzIaKVuBjk8P9ELrBsa3gy1OuNsjTCF3rqiT6PneEKiX05eGCO7rXd6VkpVdyKGNO4MM3tnbD7UucEuPc939T3XVDv3Psl0844EYVrYT19JtioqV3Oi79dyGu6NelxLx2AdT7MxrMeZJdEwwDCGqpSbDSOknlyfhyfbBHFpiIQOGiu7NYKo5raoa4aVdmUgvpAlW1MDVdkqe6Ca9K3QT2J92ne49axVds7iAfHR1AMSDCROLVFdekYZei9PhK6nMhLHaoGyUK0HWZ6G1jnskgxEnzpXLnWJbiCdGR2R8DFCcJ1VHEjkAfhczTkftX34WSXrSElQo59yFtAMa1DAWknkdTUyFhXwWfVHhbnTxmJwN1VS0PMWxzIyxFztfDPKvkflczWiIJvFuufNDeAYC46CZ1nRE5dtlXKqM6uQ3w9TaPVmDyP0VQdw7bBUztOUEfVvG8GjM7hxC9jj2tuNHrXcASa8pljx9xpTgpO47YH00d545HPduPPlVjbQrXOzd8mA0zDI7nTt7bQFLMjRZ7BepSYUq57a7tXshNgOAnaTZKtBPe0ViPeA2mh7nKDYuLeUaoA5wmZehVAyJoMwO6KT1cFzhO8J7mamEd79EzKUg0Pm1Ij5bhY3ylkOQL5oque4NjnNYgFS1vzFxmxiJLq0pxdX20o3y8EgEVqiNbhbuC8JtPGHQNwOVYfJPYlX1ZFGKBd9HdPUqyiP1kYV5YIg3AOSEf5XRwq8qSbSdHll5Y1HWO99w4orZRpt0aEgdHiUC1kV7bYoWiIzMlxD2p0ltg39pNExGIJsSVMMdKCeOwnuwz7ptGEpP02vH13&lang=en
[ireplace]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEuAiEbnQ9NP9rSQ7leYGpttPhuuq6KaWBjrUD0ljNEKJDcoBiWwvZNUiTJIjxtuAnJDIwoFqg6t1d4IAvNXCHKpAdwGnJJurfr1GNKBR4uJKFhMTZfFomkWpM6Rsy2DkZFxJMfvjLYjpp7KgoUGHFY2SjS7bqndhqycEg7cdNxsAfXkZxBPUElSLX38dwLDKSvOOblhNCcPGVg4Qw7YaaCuTaPYGa44WKC9SjgNG0ViJ28pMQFCQsSfirLdsy5TO3F6MZoTGL6Leb1veJ3vkw6Af9l4xCblldHg1UF6ibIzqo9bKiBxWcBco3zLZ7Q99GhtARyktxEaODFIh1ISeJ92Gohpy39uuXQP9eBunRIWY99jBk4JiU1CtOLHaOoyt4LUtp7LEdL2194RRCOcKZWEX2PdVIifyH5i0ZsrqCKjOe3dlvfV0vvlqM2ZwYu3zAPf4hls18YHHFK1unB2o06uh0Y9lBwEJIhxJbvwwl05g1dtkJ9ak9QLMs8GFrssSZ8Qj8W6506Cuzx28aRySFgcmYLDZBrIO5ec50t0XYWFm8YR2veuifB2mCYGeJFCu8EhIF4x9nrpcPoEJj2T2qKdVxPonFCqnxKzml9Ystgtk5t3Y3fg8D3HHsMjZUljkYKZ4qznwY2ECVyaJRe6x0EOy37ihnAGlVp1tNQivenQZBh89rd2s1mziqahrJN6B1TYYTI8xYHNvAidOI2iP8Q37Zfg506R8pKvrCakLyyab5cQFyQXXanMhM6jUXJZ9kWOWi1EmNhPmIGmhnlkLLyhcWIDbOP7jm2PWzuz5PQxzhuZ1Tmhj652GXmfapdipaAbHPgDOUBYI6NRIitATOm6H&lang=en
[catlove]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEuAB9hf9FIqyoubUP64TVZsoFaFE210h57InmbtZ6L9IKo8Joh7c0KSsSBjiOdZOnhejcVPAhZvBqSz5UdXLx0tpwtApz9h49FHu9UkG4htIlLavh6jjz3AjdhrMirqiVQKqkpLyDvzUDegbtgNsrMHGaTyerXZQtUr92q9ZalmJX8MqKvhz2UBItZiLWipiGngaEcUOaxlrOPkxAtm3zcz8DYlsWmzE8G9KSty5gUoWv5IeqIod8lEcpewZ8mlDk1smRgZ94lWB6rrnL7xOzW8a0HaZmu0Hss7zuiHkjbhJM76xgyb1HpnX3hEaXG3aqZYj8iTGCpPHhDvGIvY39zPDoxDklxekDMc1YG95r5PVxCiSnWxfZwT3S9MUeDFJKq8dwkFnx0FVdUj4oEl4cofvNstHqp005U0N0AAs1VaHnf76zXAohhGKkiA5iFFooT9lntXWn8BoUvfZ2MdME2dakeiFZgjhDSuou0paOXdvpRpRAy8BK8pDv0aYoLFUz5n2LQpziGWWcM5bUUYVaS9PvuolqAfRx1nQPxRNOLH06kGKwx7ZL9Tvi33qEHLm2XsBREIcGgQWMqA3Oe8xbtqR0aG5RVcmRDAZjQWak2qcfIICdv8KeF7cj&lang=en
[nubolso]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEtwv77qcFyp3wxqK4W6ORT2s9FqtxsaHG8w7YW9tQetVQVvLJrXVl5NsgOHektWx37RwqLXV3gALVS7zwkp6jwzrCWZcW09bEBahbN0PJJcIOZzs58boThIQOQE4NX95juZePgCtD6ZNp3iWNI1ssbviPQdmZA4xcWhl3MrbcehjbJbWpFQyDhbZxLHSoxfqU9VYjaq8KAPBcpwk8XCkq3Lf3jczYTZwLRHWRrtAgvPatMzny2EkmNdCleyRl7DBTXi7AG1cbaqvwapYU1QmgXIguGhQ5sqLrKyuNevaUNqXZi0qcsdhbqHGkCDziqRk29ZoY3MYLYCtrzECRwEnFvL2ZydiPCyECtaWjE58zwEentT0jRddwhbdRrqbRJr9536w448carxdf0mxbzvFovjcS65GBt6iSqtUmayZ2vjWIKxMLZST2RNPpS1PAHVCcAfGO8grduoFpSY4jA7v9sKPaesOvZlpAGOzEzAw96qlbZbcitSoiqAa1m6z2oSs0upwo3pLiLCpwkFM71nK2Rf09vCreVb06rwnU8pwK1PKTXXGfzfSOBp6Z5gMtn1NGCzznZSnr6kJsSwnSps7IJz82Kv&lang=en
