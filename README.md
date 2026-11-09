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
| [CatLove][catlove] · Pet delivery                  | Pick a delivery window and send a simulated voice note.                    |
| [NuBolso][nubolso] · Banking self-service          | Choose a statement period and open a simulated PDF.                        |

Use the visual editor or journey JSON to build a scenario. Save it in your browser, share it as a link, or export a phone-only video or GIF. Use fictional data in shared journeys.

## Documentation

- [Get started](docs/getting-started.md) for local setup and the portable HTML build.
- [User guide](docs/user-guide.md) for editing, playback, sharing and recording.
- [Build with an LLM](docs/ai-guide.md) and [Automation API](docs/automation.md) for the journey schema, validation and link generation.
- [Architecture](docs/architecture.md) and [Deployment](docs/deployment.md) for project internals and the GitHub Pages workflow.
- [Contributing](CONTRIBUTING.md) · [Report an issue](https://github.com/guilher-me/whats-demo/issues) · [MIT license](LICENSE)

WhatsDemo is an independent simulator for fictional conversations.

[magazine-luzia]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEuATxuQiBO6WDdmOuQARaUhkP0WiqPr3ThVzhElccu96D7qi1BP8FiNKBgKlCF5yttF91mPjFbXYMcitdddhW2gX6bHFARRtNoFN0Pr4JSvKpkUrM9QczFqipTf61bLQbEAjut49xROgABfzMbFrHM39VByzZEisBuwlcfGeyPWHfpjInOtIhrfsI1ckznt0wX7OVpGZJplxlGqB0p3yVVbBklu674AwwwKSjB95S53xhKU9RxlcW95PGIHzvGfXdzMT6iIfHSJEG6iOcZVxDtaPqBUshT9dpq4hZnuzz7H1wvFUN2e5HZDpceqzAqSbbxf1XvsHv1jsrqyPYkdIiISwveZgGTPbNdsx0JJUBAZOcDCs7IMEiYahRFXcHHDi1XkfcJMZseyjCwpnxUrZXxq61WcFvaLgpxIwJIHXtEif1QTqYVguhoE0iuf7xyXptEPWWl5bYkd7mrucPdXEiA4KRO1YIqoEqWweARlwd35p0U2x4oNwuyUpTavrEqSa3JVtugfOZ58wBReSWTM0pRnE5tnnkoq8wRFUhE7QBQOnLe3orJqotCkOOtR5RdXr74hOyuudHqG97okd9I1zHBZ3ue2g9EqvULMHZDUnyZDOWV3gbMFYVkT3z7GkE71AFldc09XLn43i1KalJVAtJ8iWabdxUU365Ty9telLREtvCWZ9OkNp7kMr7Pnt3kUn3XRKqPLG1QOTtBHgsjF3Zvz0WgLNTSrlfYDCd4zipznjEPqFGBc03qIr8Tn1io8l0FuRnzqMeuu2qZYidchLyJDXQrkuiKnUxuYfue1edKJ8WEm0axyJdllneSKpcaYcfSzE&lang=en
[odontonext]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbFLYFMM7469yXX5KcEPT7lclrTPAwTjUYFLX7WPCyKhfggFJXS4gA6aJYucuIRImxgAPiO2RiOcdHZX9wPis2fJW4RI4uZxxpAjMp8V49je4kLEc06CxDcx2SlzMDmKN02sxfwiNh8jjgrpf8b0KUpMPl0oeyuv0RlqStNNvcVRU733CWxS3j4J2DRzurlWTpwOSxqRLj4XHWjM1SuVpXFu6dxNnHd7WvGPRh5r7EO7vSQcUJEsGkr387DvCHeGd3YlZWw3PybyUdhtm5YJGg4XE0PV8xUbZDgZZtdjhGEd1DbtkhtLAc5i2gCJEYdGlhecxsKDIVW8aYbZtriJ6rJFDcSic4z9vPxqn2fSAbFcpeRRHrFUG01D8y2iXCmbwFAqlHEBEmysjM16CTkI8hXFLCZ1xhnEKvKttv536s5fRdmT5Rj4IeDpZYVDNgYOR8NNSntjI3zJzWsolnqDu45ubemEkcJHnhCgUSa3nBmHmUa8ADGPi4w5vvM5u7HY8UgZPKXXDezlqJeLfbdPbL18HNYLAiVa2b2cHgh336LntgL6P6VhI38P51Tu2KsBSuRkm3ta3CqzFsjDpH8pECJao2P5TyGaekVQ7F4zhctLbe78km4qiX7b7GEVBeYAibsZSU7K9MvhDow6cZcRoVt9j6nyScNlc9OKpDdtsUG9M49y6L7YyEJxk1RjqVTchn9JOMtjj6joww9S1bubIcPm7vR1HMHgQCLbLCchUru7QZkkSmOvpycPYKZyRrwjGsQTYyc9y2CshMyDaWnaKI5SWOmuxn7Tj1MrjXBTqp56GPbrJJ4uGFBa9MX6VJ5ZVQdSBLVvMRG43uIYXAsGJBfGGwzenIs2w86Mqmd42goS2dT0keP7wMLdG9Cko3P3OKlIaRqDOOafUu6VHTtpwN1KgskkHXhX9cJNCkc3lEwcakDmL986UNiZk43RAyNtHCapxTj2OO731FrYqIFFkkUUlMUM8bstiINC0vfyAsxtGEPumYfLMFJGv0bpTuf4gnj19Yzv0vHjf&lang=en
[ireplace]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEuAgv4XSSrqj0YGB2gzrc1Kmwwr2tqQlRdHpCvBEhStGPOzaPGro6ossFhDCy3MMu7hyrNrERm63Uw02L9n5OOiNhzjqwvFTqVcZIhxm4874VoaDXMCKsWnoUFF0OiwLuGF0hgswXjOIN2XUWprfrXO4zPf62o50UqUF9LyjyMi2VMfNpNp4LZQdaCim5NTnBzPpylq1jICHZt9nZx73DCu2v1bdRCb8RKK4QYALnoTKILEbMGFqz098PlstU1yN7cKC9jXig98LglcLWaCUtDd5fiXPDdpc9QXwxbu3vnrZxIxTJAJdgqKhkl8rrxapFK41nurg6YFDQfU7ZdKzGHZtaNlGYysRFC5G4ZsJFplKaZFIWaaavtssAdNmyDBvxmP1h04xkjmv4Um7mpb6l3mr0sYo2IP5BLC23aVgAL7wHvbkb3VeQARM4A0smvDhYiSVWQlUKdj0k5aiNBVY4QCDqIxbwa9mzi40CZQCbFw6b1nWgb6pzkfRDNZfSj8ILTbzKYlaofkldgzOR729iVzXAgMG2XlxwpJPu5QZFjUoVDQ8gafPgB9xXa0IrbUqKOS577l8ebYZIDsgY4lJh4xFE2vj0hFeqWJREYx2Gi1JX7UlIxpkOdol45sAlKvg6gkE3K4tzi8M6HMFvBuIiiKKCl6pEJdzTNpC0ia9LnGrQR1QNTTU9gPrIwq3MjNblfquoWY4vhrJ4ZBHfftxq0ApRWePh0A1hJMRuTOipZjJDgAvaJu2Q4E9t4jsXCCJhU0nkFvC4SBl0X5pVZXkCjs01AbHdsnCuuIXOk4IqeQvPAv28k4kDM3PM&lang=en
[catlove]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEtwoKwrb45DZCATmOKJvfZrxP3FHheOpdpsLj1se2MwvYQQ7dVInbHo2UqondK25bReQonJMtKWwQv37FWMNwbMbpeIl16xjGAQ2a5BdBA0pzB1H4QXZv791Ma6GLJfNsPV0442iQBMh1Efwyqfq0NFA8RgvYTWDemQAvKGOQpnbmkvpsvdkPzMONLdcBE0QKgl4426NVT7pHW7zylhTWImKbWYDmrTBOL4UPXiCDQSNfAWlVTWbz6EWisCsQZ3FK0FpukyPJ5Jh0snjGyqAizJCC0Go2nnfc82O9PnGgeoBABfF40qJvlCTiYIi1cfR01Bu35eVwNbKf78f9HYDXflbXINqg9UWM62ahKhLA09nJIzHUumkYd8PH0XvfkufznVpzlxYm4dCRAHy6N6hNeF14pwQSNfx5d0wPGdfpt7ktyOIEedLRRzzhhbQZ6rVX0Kk0qB8QugbbwdML4yAu0yg5E6AWwYgDzGiZV5Ho8Vgf7JcGRRgUZE9aptjL54mY3C4gNni681jtYoB8UeaqGYkN8B36akLdvq5PIFizniOfVC8bQPGpWGzR36hEsQRi2isUXi5w4iNAvcwyJ0bhCP50naPwMiGTGzrAD9HS&lang=en
[nubolso]: https://guilher-me.github.io/whats-demo/#demo=v3z.SbEuAIREycAA7jO1SSuNZWvNS6KDNSrH0KnVdXuBtjuYZHoKFqRlbIG662eznOsSRL6Tv36t7Za66UVO6fwOrFGqSJqWnmjHONuhMjr2ypLa15eUMjhPfm2FzfewV9JQjPsctZTQC5wsn0bOxQMhpvAnBCCaG7HabDMy6vApmoSyc0CzMly1GHtfwFz5eMx7MmTSi83f9I90J6ImNQfsjDYcGztIV8O2ySCYlTlx1xiLaKzP2b4XWV2eQ7P6hW0vhbWOorzOqvFGJ1jECrOY9J9KLwfdMNPuJmbR7rAcDkd24Xug4D5v3cuDmNQU1EjebE9uQ6suHV0TfOnNyDQXLO1s8YIyajhH6C8rfdVJYe0RV3y6852IQ38TPd9JnKCVjfs6CiQR9KdknSMcD9nZPjIRsC63BOX10JvQGgGKnWFxpY1OyTHMPfEY9iAomNIvf6byCv7E6p4dBBLD6UX6KI8BKZK8z8iUAe4Dr4k3LlzFEMbLWIqFkRcWRENV36zTAqfRBppeVDEDrLDHnplZ8dgH0qv5NeqXQVs9WaJTUVFyY5WXgdLfjfSVIx4Y6mpbb7KAtEpynqTVB0JT6Q8tvdFIkh1be554&lang=en
