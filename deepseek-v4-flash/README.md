# DeepSeek Local Full Stack

📺 **Uncut recording:** [What Local AI Coding Actually Feels Like on a 128GB Mac](https://youtu.be/hVpOxnESKVs) — DeepSeek V4 Flash (dwarfstar) building this app in one full session, no cloud help.

A small local-first full-stack app built during a CloudYeti recording experiment: coding on a 128GB Mac with a local LLM.

The app takes a draft video idea, generates title options with the Codex CLI, and can generate thumbnail image variants. It stores state locally and is intended for local development, not cloud deployment.

**See also:** [FAQ.md](FAQ.md) (viewer questions, answered) · [RESULTS.md](RESULTS.md) (measured tok/s, RAM, run log)

## Stack

- Node.js + Express backend
- Static HTML frontend
- JSON file storage under `data/`
- Codex CLI integration for title/image generation

## Run locally

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Notes

- `node_modules/`, `data/`, `generated_images/`, `.DS_Store`, and local database files are ignored.
- Generated data and images are local artifacts and are not committed.
- The Codex CLI must be installed and authenticated for generation features to work.
