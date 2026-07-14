# Local AI Coding Sessions

Full-stack apps built **entirely by local LLMs** on a 128GB Mac — no cloud model, no ChatGPT/Claude rescue — recorded uncut for CloudYeti. Each folder is one session: the same task ("build a video title + thumbnail generator") given to a different local model, so you can compare what actually happens.

| Session | Model | Harness | Recording |
|---------|-------|---------|-----------|
| [`deepseek-v4-flash/`](deepseek-v4-flash/) | DeepSeek V4 Flash (dwarfstar) | Pi | [What Local AI Coding Actually Feels Like on a 128GB Mac](https://youtu.be/hVpOxnESKVs) |
| [`qwen-3.6-27b/`](qwen-3.6-27b/) | Qwen 3.6 27B Q6 (llama.cpp) | Pi | [Can Qwen 3.6 27B Replace Claude Code? Full Uncut Session](https://youtu.be/6NhLP_YGZVw) |

Same task, same rig, different model — the point is the honest, uncut run: where it fails, how it recovers, and how fast it really is. Each folder has its own README with the exact prompt and setup.

## The standard task prompt

Every session uses the **same canonical prompt** so the runs are comparable — full copy‑pasteable version in **[PROMPT.md](PROMPT.md)**:

> build me a full stack app to generate titles for my video idea. Give me 9 titles and rank them with a score. and for each title I should be able to generate a thumbnail. but don't use any API for LLM or image gen. use codex exec.

…followed by the `codex exec` guidance (shell out to the local CLI, `--sandbox read-only` for text and `--sandbox workspace-write` + `$imagegen` for thumbnails, pass the prompt as a single argv element, gate image gen behind opt‑in, one call per request). See [PROMPT.md](PROMPT.md) for the exact block.

## The setup (Pi harness + local servers)

The exact Pi config used for these runs is in **[`pi-config/`](pi-config/)** — the provider
`models.json`, `settings.json`, the llama.cpp launch script for Qwen, and notes on the MTP
flags and the DeepSeek `ds4`/dwarfstar engine. Local coding agent, local model, no cloud,
no MCP servers.

## Benchmarks (M3 Max, 128GB)

Same rig, same task. Numbers are what was actually observed on the runs — cells marked
`— (measure)` get filled on the next dedicated benchmark pass. Each session folder's
`RESULTS.md` has the detailed per-run breakdown.

| Model | Quant | Engine (port) | Gen tok/s (short → deep ctx) | Prefill tok/s | Draft accept | Peak RAM | Context | Human nudges | Result |
|-------|-------|---------------|------------------------------|---------------|--------------|----------|---------|--------------|--------|
| Qwen 3.6 27B | Q6_K (MTP) | llama.cpp (:8090) | ~17 → ~10–12 | ~150 | ~93% (MTP) | ~32 GB idle | 100k | — (measure) | Finished, recovered from a server crash |
| DeepSeek V4 Flash | dwarfstar build | ds4 (:8000) | — (measure) | — (measure) | n/a | — (measure) | 100k | — (measure) | Finished in ~2h+, needed one rescue |

> Note: on my own run I felt DS4 was slightly faster in tok/s, but Qwen 3.6 27B Q6 was a bit
> better overall. The point of the table is to replace that *feeling* with measured numbers —
> so treat blank cells as "not measured yet," not zero.

## Recording checklist (for the next session in this series)

Before/while recording an uncut local run, put these **on screen** — every one is something
viewers explicitly asked for in comments:

- [ ] **Context length** visible (e.g. an overlay: `ctx: 100k`). Viewers call out when a big‑context model is run at a small setting.
- [ ] **The exact prompt** on screen at the start (it's in [PROMPT.md](PROMPT.md) — same one every time).
- [ ] **Live tok/s + model + quant** as a persistent badge.
- [ ] **Activity Monitor / memory pressure** shown at least once during the heavy part of the run.
- [ ] **Chapter marker** at the failure + recovery moment (that's the retention spike — make it findable).
- [ ] Audio checked (mono/one‑sided is an easy regression — verify the input channel).
- [ ] Log the run's numbers into this repo's `RESULTS.md` + the benchmark table above.

## Why local

No API keys in app code. Generation in these apps shells out to the local `codex` CLI; the models that *wrote* the code ran fully on-device via llama.cpp / Pi on a 128GB Mac.

— [CloudYeti](https://youtube.com/@CloudYeti) · [cloudyeti.io](https://cloudyeti.io)
