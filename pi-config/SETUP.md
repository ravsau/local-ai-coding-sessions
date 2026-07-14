# Pi Harness Setup

This is the exact [Pi](https://github.com/ml-explore/pi) config used for these recordings:
a local coding agent driving a local model on a 128GB Mac, no cloud model.

## Philosophy

- **No MCP servers, minimal tooling.** Fewer tools means less context spent on tool
  definitions, which keeps a small local model on-task over a long run.
- **Small context on purpose.** The models here are quantized and local; the less you
  bloat the context, the more reliable the tool-calling stays.
- **`medium` thinking level** — enough reasoning for real coding without runaway thinking
  tokens on a machine where every token costs wall-clock time.

## Files

| File | What it is |
|------|-----------|
| [`models.json`](models.json) | Pi providers — every model is a **local** OpenAI-compatible endpoint (`apiKey: none`). No hosted APIs. |
| [`settings.json`](settings.json) | Default model/provider + thinking level. |
| [`qwen3.6-27b-start-server.sh`](qwen3.6-27b-start-server.sh) | The llama.cpp server behind the Qwen sessions. |

Copy `models.json` / `settings.json` to `~/.pi/agent/`. (Auth is not included — these are
keyless local endpoints; there's nothing to authenticate.)

## The two models in this repo

**Qwen 3.6 27B** runs through **llama.cpp** (`llama-server`) on port `8090`.
See `qwen3.6-27b-start-server.sh`. Two things that matter:

- **MTP needs BOTH flags.** `--spec-type draft-mtp` alone does nothing — you must also add
  `--spec-draft-n-max 2`. That's what activates multi-token prediction (got ~93% draft
  acceptance, ~11.8 → 17 tok/s here). Verify via `/slots`, not `/props`.
- **KV cache must be `f16` on Metal.** bf16/quantized KV falls to slow kernels; don't add
  `--no-mmap` on a Mac (unified memory wants mmap).

**DeepSeek V4 Flash** does **not** use llama.cpp. It runs on antirez's dedicated
`ds4` / dwarfstar engine (a purpose-built DeepSeek-V4-Flash inference engine, not a generic
GGUF runner) on port `8000`. In `models.json` that's the `ds4` provider. Same Pi harness,
different underlying server.

## Point Pi at a local model

```bash
# set the default in settings.json, or per-session:
pi --model qwen3.6-27b-q6k-mtp     # llama.cpp on :8090
pi --model deepseek-v4-flash       # ds4/dwarfstar engine on :8000
```
