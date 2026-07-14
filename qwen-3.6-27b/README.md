# Qwen 3.6 27B Local Full Stack

📺 **Uncut recording:** [Can Qwen 3.6 27B Replace Claude Code? Full Uncut Local Coding Session](https://youtu.be/6NhLP_YGZVw) — Qwen 3.6 27B Q6 (llama.cpp, Pi as the coding agent) building this app in one uncut 52‑minute session on a 128GB Mac, no cloud help.

A local-first full-stack app: enter a video idea, get 9 ranked title options, and generate a thumbnail for each — all generation runs locally through the `codex` CLI (no LLM/image API keys in app code).

## Stack

- Node.js + Express backend (`server/`)
- Vite + React frontend (`client/`)
- Codex CLI (`codex exec`) as a subprocess for title text + `$imagegen` thumbnails

## The initial prompt used in the recording

> build me a full stack app to generate titles for my video idea. Give me 9 titles and rank them with a score. and for each title I should be able to generate a thumbnail. but don't use any API for LLM or image gen. use codex exec.

The full brief specified: shell out to `codex exec` as a child process (never an SDK), `--sandbox read-only` for text and `--sandbox workspace-write` + `$imagegen` for images, pass the prompt as a single argv element (injection safety), gate image gen behind an explicit opt-in, and surface a setup message if the `codex` CLI is missing instead of falling back to an API.

## Run locally

```bash
# backend
cd server && npm install && node index.js
# frontend (separate terminal)
cd client && npm install && npm run dev
```

The `codex` CLI must be installed and authenticated for title/thumbnail generation to work.

## Notes

- `node_modules/` and generated thumbnails are local artifacts.
- One `codex exec` call per generation request; no long-lived session.
