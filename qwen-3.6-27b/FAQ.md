# FAQ — Qwen 3.6 27B local coding session

Questions from the video + the r/LocalLLM thread. If something here is wrong or out of date,
open an issue or PR — that's what this repo is for.

### What's your Pi setup? MCPs, skills, special tools? Which Jinja template?
No MCP servers and no extra tools — that's deliberate; fewer tool definitions means less
context spent, which keeps a small local model on-task over a long run. The full config
(provider `models.json`, `settings.json`, thinking level) is in [`../pi-config/`](../pi-config/).
Qwen runs through llama.cpp with `--jinja` and the model's built-in chat template plus
`{"preserve_thinking": true}` — see [`../pi-config/qwen3.6-27b-start-server.sh`](../pi-config/qwen3.6-27b-start-server.sh).

### How do you keep tool-calling from flying off the rails over a long run?
Keep the context small on purpose (no MCPs, no tool bloat) and give one clear task with a
tight loop of "run → see the error → fix." Most drift comes from a context that keeps growing;
the less you stuff into it, the more reliable the tool-calling stays. A running app that
throws a real error is a better instruction than more prose.

### How small is "small" for the context window?
The server is launched with 100k (`-c 102400`), but the working context for this task stayed
far below that. Big context available ≠ big context used — you want headroom, not a full window.

### Is the MTPLX / MLX version faster than Q6 on a Mac?
Not tested yet — it's on the list. What's measured here: llama.cpp with MTP speculative
decoding (`--spec-type draft-mtp` **and** `--spec-draft-n-max 2`, both required) hit ~93% draft
acceptance and roughly +44% tok/s vs no MTP. MTPLX is the MLX-side equivalent and is the next
speed test.

### Qwen 3.5 122B vs Qwen 3.6 27B on a 128GB Mac — which should I run?
Planned as its own video. Short version: 27B leaves far more headroom and runs faster; 122B
trades speed for capability. The uncut comparison is coming.

### Should I use the temperature/sampling config from the HuggingFace card?
This run used Qwen's published defaults (`--temp 0.6 --top-p 0.95 --top-k 20 --min-p 0.0`).
Whether the card's coding/thinking-mode settings change the outcome is a good test I haven't
run head-to-head yet.

### Why one-shot a full-stack app at all?
It's a benchmark for long-horizon, multi-step work — not a claim that one-shotting is how you
should build production apps. The interesting part is whether the model can plan, hit a
failure, and recover across a long session without cloud help.

### Can it respond with only the changed lines instead of rewriting files?
Yes — ask for it explicitly ("return only the modified functions/lines"). You get what you
ask for; it's a prompting choice, not a model limit.

### What is `codex exec` doing here — isn't that cloud?
The *app* uses the local `codex` CLI as a subprocess for its title/thumbnail generation (auth
lives in the CLI, no API keys in app code). The *coding agent that built the app* — Qwen via
Pi — ran fully on-device. See [PROMPT.md](../PROMPT.md).
