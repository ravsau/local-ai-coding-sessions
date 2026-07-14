# FAQ — DeepSeek V4 Flash local coding session

Questions from the video + the r/LocalLLM thread. If something here is wrong or out of date,
open an issue or PR — that's what this repo is for.

### Why did you run at 32k context when the model supports 1M?
Available context ≠ context you should fill. A larger window costs memory and slows generation
as it fills, and this task didn't need it. That said, several viewers wanted to see a bigger
window — the next run puts the context setting on screen and tests a larger value openly.

### DeepSeek V4 Flash vs Qwen 3.6 27B Q8 (MLX) — which is better?
On my runs DS4 felt slightly faster in tok/s, but Qwen 3.6 27B Q6 felt a bit better overall.
That's a *feeling*, not a measurement — the [benchmark table](../README.md#benchmarks-m3-max-128gb)
is being filled with real numbers so the answer stops being vibes.

### Why run V4 Flash locally when it's cheap and good on the API?
Fair question, and honestly it's the weakest case for *this specific* model — the API is cheap.
Local wins when the task is **repeated, private, or high-volume** enough that per-call API cost
adds up, or when you need it to run offline. For a one-off, the API is fine. This run is about
whether it *can* run locally and stay coherent over a long session, not that you always should.

### It's slow on context processing on my machine (GB10 / smaller box)
Prefill (context processing) is the expensive part on Apple/edge hardware, and it gets slower
as the window grows. It's usable as a "fire it at an overnight task" fallback more than a
snappy interactive driver on smaller rigs.

### How does it fit in 128GB / handle long context?
DS4 is an MoE that unloads inactive experts, which is what makes larger context windows
feasible on a 128GB Mac — it slows down as the window fills but stays workable.

### What engine is this? Is it llama.cpp?
No — DeepSeek V4 Flash runs on antirez's dedicated `ds4` / dwarfstar engine (a purpose-built
DeepSeek-V4-Flash inference engine, **not** a generic GGUF runner) on port `8000`. Same Pi
harness as the Qwen run, different underlying server. Config in [`../pi-config/`](../pi-config/).

### Did it need a cloud rescue?
This run took ~2h+ and needed one rescue — which is exactly the kind of thing the uncut format
is meant to show honestly rather than edit out. The Qwen run on the same task finished faster
without one.

### What is `codex exec` doing here — isn't that cloud?
The *app* shells out to the local `codex` CLI for its title/thumbnail generation (no API keys
in app code). The *coding agent that built the app* — DeepSeek via Pi — ran on-device. See
[PROMPT.md](../PROMPT.md).
