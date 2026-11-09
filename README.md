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

| Demo                                               | Idioma                                                                    | What the customer can try                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Magazine Luzia][magazine-luzia] · Retail checkout | <img src="assets/flags/br.svg" alt="" width="16" height="16" /> Português | Browse products, send a cart and see a simulated Pix charge for the order. |
| [OdontoNext][odontonext] · Dental booking          | <img src="assets/flags/br.svg" alt="" width="16" height="16" /> Português | Complete a WhatsApp Flow and receive a personalized confirmation.          |
| [CatLove][catlove] · Pet delivery                  | <img src="assets/flags/br.svg" alt="" width="16" height="16" /> Português | Reply to a delivery update template and send a simulated voice note.       |
| [iReplace][ireplace] · Repair intake               | <img src="assets/flags/us.svg" alt="" width="16" height="16" /> English   | Choose a problem, send a simulated photo and get a location card.          |
| [NoBank][nobank] · Banking self-service            | <img src="assets/flags/es.svg" alt="" width="16" height="16" /> Español   | Choose a statement period and open a simulated PDF.                        |

Use the visual editor or journey JSON to build a scenario. Save it in your browser, share it as a link, or export a phone-only video or GIF. Use fictional data in shared journeys.

## Documentation

- [Get started](docs/getting-started.md) for local setup and the portable HTML build.
- [User guide](docs/user-guide.md) for editing, playback, sharing and recording.
- [Build with an LLM](docs/ai-guide.md) and [Automation API](docs/automation.md) for the journey schema, validation and link generation.
- [Architecture](docs/architecture.md) and [Deployment](docs/deployment.md) for project internals and the GitHub Pages workflow.
- [Contributing](CONTRIBUTING.md) · [Report an issue](https://github.com/guilher-me/whats-demo/issues) · [MIT license](LICENSE)

WhatsDemo is an independent simulator for fictional conversations.

[magazine-luzia]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEtx7kmpITN6Uz36XiCWsP8Pv32sTb3KPkDUiqHcqpaU1uPYH7n0RWEKTPJ7khdzal0TnmEOGAz0jurZZglkF6GpvLokC9TovoW0Kdo5zmyT2rrgzkOIw841J69dXZsvT37FF7li2BKVnIcZk1GstvDvCabeTkOYovFRuWaWSoPeQAnVzXsbYwjC8kSyqn7bxZpY4lhWIc5AHJ7JOiUPgeifWsHNN2mrb5ARNdd6w1Nl06cCbXiiu4lSLTqUSyFpwXIjTIr7nZruuNRdgzNORgvVLpqG0bqmrnMnB5rP0Qq4pL1EQawrCO4ksQAhPGibZFrXFLtOU70WbDz8VcEnt4wBEpORstEWZzA5oiPoZFioglBjZRwJ4KfWAxncskXsLZ7VT4Xwe9lPNnbjk7pZJWTgsntFKKrXgsuFuGvvcELuVOqX8n1VGkwdYoRemyi9pHmFIeKERrSQYNmcYFgFe957uhJHqndC8ZLeJ54jICtO7B9zQ7I6JAG9y0WCw7FSTMGQCZHR7tVfo9PAqKmX0Zo8jMpftaXakrQ11D0F9MazvKnABeLpVi8VIy4P7rgbyrGAPsZvNhWX36cDIhuOOTlTIPIts5kIcDal7wFbzbkOgStSKjTtyf4L5BDESrcuFI4rOkQtxYlUSxwKYdlRBUMQiVqwJxtEoxhsgbhs26jdaDiRm0byRbBRjtRuT0oPbbNg5RuEFOx0SM1fDiJoCpoTYfsjlXrxnM5GLJELyqS3LPQ0ivsrJzGis9se42GzPrUrwHEwDRqBmeiKXU8rhyR8AfZEY1FXErPib48EN2Mlft5KetgZKnZZC72SeAqlpCQP7xq7KHy6W8hTFz1kEfwbRAd4I7XYKIMao71r5&lang=pt-BR
[odontonext]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbFLY8Af3sXWkQJVXRAG0uoz7hh7XO2wC30ljD1voagWljNwtlni8wKQ09NHesvpmtBEL90fnJoS18Cq7k98PnWhDbC2IPDIVHREYAH42t8ngcn76VhZufomxGd0hqtQ4V239o2LzZipUaxhu9KMEHQ4UNiEJjQnOE7YbCTDQgB0x1NwN5kfhfVuzYXl04wZhJvj8fORYe97TBBYkcIy4S1FB6dMXcRIU1ITldwTtBcTuIR1bAdtyjwZBfxF83dJxCNU5I9hmcI3VlaU4skNtviOnZZGieIMFux62uz7xtPpoPgzY39IcdnjmtI7WpYKrNKn4j8jK2qjB4kYVrYXzqiPi5nRndOBkT2WHbi0oxa9mG7PVJSjz6zQWtOjEdwRP4eTv3uSOwj2mRt0FWz9kYxLmL1lZDuBKzRAkuQmfb4JVsIZwKvwQpGmnnxrkkr9pgXfcJoYwo6y3xn7qhH3zdjm4ak8VXwGMV0fRFDiH7nU66dQ0zBPMYAVcWQSnYI6CUxmJM00VUrDbBcRquSA5xwywBavzV1TkTDvx9erZer4mFQKZwoUSkTuUUwitMGbhdDMtyaZVvnxqkvSWtlGQCWwsk8LdeMKsPwMYWH6t9iQn7MEO2ji4uMbUeOImS8hki8lEPV8ll3PU8QZM0kF1v6bk9i76wi1XeZQREgsg6wyyColA7j22spsFz4qOatwbXNtPREThmBezDMVJBpu0YxNge8w7ZDkCx4E52nmxusKLZ64fkhkNLJq2Sf1IbnjsFM9MVZeBlJ4MfTEv5t6p1mYujZUdRcRRzKMFh0HZ4rF1CXyRyWgpnPkTznsMTFLQBsZ6jtQCUPCGD11ioy0n3cIMMiPL5Y7zuXIjcBI6T5wga4vY6MimOLZXTMpVJ4TkOdhlDWW0n1zsqXTT52h3WGmgSF3ehkIwfj4kE7ngV9IMghv5DV8lwNYytzS2y1Ak12YWnFu25Khq0w6NDIjgnQx35wpcoFzcEgomZ3Bok0luEPQ0GLHdbflDuPJ2cFTGlvtjf6z4uyFMjmERD59C8g8bCF75GnFrA3HfsJjhDdxLEXqjdd7A0&lang=pt-BR
[catlove]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEuAB3QmBNmXsUFtBGvpNFxWn58FS7u01iOPSfodcOtPaaHaJpMZo7m7lZBetAMCurIgDNT4PH5kHLbS8S2xvKi1OZrIHecLUPmn9H6KGawzH8MsFbdsuMJuxd4iCxkpZnidIQX5SNSQ8Tb5YA0GcPlmpDkkOlSwHReYQZa6XVMXywdeKRYbJxxb92b1B5XFFzyQdavw71oSGsgrmwnOAoIS9pFTQWVtq6QOyk6V9aOrKXxKdncawVR2FQy2ZUZlKGWsZjgRGZz18Q1DFXEGftQkC8d2qIFhAXSKLox4bvmgOlF5oEHw5YK7432nZkTwvsLyPeQJNcJDdzOYR0yku6EJqEMnal1BKKiOCYGw4ZOX9GwQhHhaykXLVZtg5zLmabvuwgfk5dFOyy1UaQqTQbBZn8rhrxrBDWTvrDmHYL3k4DVuOYXhFXLGTuY83Q5vPLg2gJyDLr25QojiNRA3jgXP2h8WbUVvBR0rP2E5w7w2YE2lSSTVmvX1C5NPDKDiqt2TSD6U57vzm1Znzk6pNpGXECq8jEtxxXIjwwawGulWnGcSAHzPPJLt267A92ZYsC59nkut3ZPxOjqnBPtO1J8mAS8sxUvaYWHDt23hInMmyrex60cJpGQTuDOLMxFKhIhd0VxIY&lang=pt-BR
[ireplace]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEuAiEbnQ9NP9rSQ7leYGpttPhuuq6KaWBjrUD0ljNEKJDcoBiWwvZNUiTJIjxtuAnJDIwoFqg6t1d4IAvNXCHKpAdwGnJJurfr1GNKBR4uJKFhMTZfFomkWpM6Rsy2DkZFxJMfvjLYjpp7KgoUGHFY2SjS7bqndhqycEg7cdNxsAfXkZxBPUElSLX38dwLDKSvOOblhNCcPGVg4Qw7YaaCuTaPYGa44WKC9SjgNG0ViJ28pMQFCQsSfirLdsy5TO3F6MZoTGL6Leb1veJ3vkw6Af9l4xCblldHg1UF6ibIzqo9bKiBxWcBco3zLZ7Q99GhtARyktxEaODFIh1ISeJ92Gohpy39uuXQP9eBunRIWY99jBk4JiU1CtOLHaOoyt4LUtp7LEdL2194RRCOcKZWEX2PdVIifyH5i0ZsrqCKjOe3dlvfV0vvlqM2ZwYu3zAPf4hls18YHHFK1unB2o06uh0Y9lBwEJIhxJbvwwl05g1dtkJ9ak9QLMs8GFrssSZ8Qj8W6506Cuzx28aRySFgcmYLDZBrIO5ec50t0XYWFm8YR2veuifB2mCYGeJFCu8EhIF4x9nrpcPoEJj2T2qKdVxPonFCqnxKzml9Ystgtk5t3Y3fg8D3HHsMjZUljkYKZ4qznwY2ECVyaJRe6x0EOy37ihnAGlVp1tNQivenQZBh89rd2s1mziqahrJN6B1TYYTI8xYHNvAidOI2iP8Q37Zfg506R8pKvrCakLyyab5cQFyQXXanMhM6jUXJZ9kWOWi1EmNhPmIGmhnlkLLyhcWIDbOP7jm2PWzuz5PQxzhuZ1Tmhj652GXmfapdipaAbHPgDOUBYI6NRIitATOm6H&lang=en
[nobank]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEuAH1TJdRuidFYTadYdTZT3XMqAxphSc9D1UTOa7Utxn8t8kmmDPxqGT7uvqhAXu1DFRRXqGpqc2fvpQx3INLHdP6R8Zo8CNpbUz0CnnvdybIrPA7SnztUCbJpEcJs5pRvX7u0JaG6ZQF4TwmqcJYLBqkYqc208E4SPeRKtxdkriXiBSdAnCbMK8KDP8r996UqJThdylb6nLez0JJGqgLV7ebTHQFcmZ8ZvZcjYN7MvHEfZaPShpN7KcwcvN5raytCf7WrPJC5ZQWyaemtmtPzO3Nm9V8nI2UzmY9S9ZY1fS8mNeZ0AKH7cIFNFG8ZPHRfNd42ZDPe2IPfTrGoI7uruq1mB9sxNrwNjSy9YfDG4GpoG5svIJbXfEhoGr47HHpvD06iB5ISZYP60JgVdwd21AOlh8R00UlSjQUyjlb89v8T29gBIQGsL7R0adlP0JAr2tRn0zl6mLLtVihpy4nP5bFshpP5VlObeB7dlOGFIvWnm7CvjbsgQWIfaCks4K4fMqCwF8zbChX5SY3UWZ1sEfShyK4I1uJEZ2vZZft8O5XlTu7pTzfAHZwN7uJH0n4WQwgrxkfgH98dL5ccmLM2YnAJnGsmkTzWVvNKlhM2158LrjkqMipi9I5s&lang=es
