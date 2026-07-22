# DeepSeek V4 Flash — Cloud (OpenRouter)

The canonical task from [`../PROMPT.md`](../PROMPT.md), run against **DeepSeek V4 Flash in the
cloud via OpenRouter**, driven by the Pi coding agent.

This is the cloud counterpart to the on-device run in [`../deepseek-v4-flash`](../deepseek-v4-flash):
**same model, same prompt, same agent — the only change is where the model runs.** The local run
was a heavily quantized (2-bit) build on a 128GB Mac and took ~2 hours; this one rents the model
in the cloud.

## The app

`title-thumbnail-generator` — give it a video idea, get **9 ranked titles** and a **thumbnail per
title**.

- `server.js` — Express server + generation endpoints
- `public/` — the frontend (`index.html`, `app.js`, `style.css`)
- `prompt.md` — the task as handed to the agent

> Note: unlike the local run (which used `codex exec` for all generation, no hosted API), this
> build wires up **Google Gemini** for the actual title text and thumbnail images
> (`gemini-flash-latest` for text, `gemini-2.5-flash-image` for images), keyed from
> `GEMINI_API_KEY` in `~/.env`. The model *doing the coding* is DeepSeek V4 Flash via OpenRouter;
> the app it wrote calls Gemini at runtime.

## How Pi was configured for OpenRouter

See [`PI-OPENROUTER-SETUP.md`](PI-OPENROUTER-SETUP.md) — the provider block for
`~/.pi/agent/models.json`, the provider-routing + prompt-caching gotcha, and how to pin a single
fp8 provider when you want a fixed quantization and cache hits.

## Run the app

```bash
npm install
export GEMINI_API_KEY=...   # or in ~/.env
npm start                    # http://localhost:3000
```

Generated thumbnails write to `thumbnails/` (gitignored — regenerable).
