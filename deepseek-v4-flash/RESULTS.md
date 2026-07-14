# Results — DeepSeek V4 Flash (M3 Max, 128GB)

Fill this after each run so the [main benchmark table](../README.md#benchmarks-m3-max-128gb)
stays honest. `— (measure)` = not captured on this run.

## Run 1 — 2026-07-08 · uncut session

**Setup**
- Model / quant: DeepSeek V4 Flash — dwarfstar build
- Engine / port: `ds4` / dwarfstar engine on `:8000`
- Agent: Pi (no MCPs, medium thinking)
- Context set: — (measure) _(shown ~32k on screen; put the real value up next run)_
- Sampling: — (measure)

**Speed / memory**
- Gen tok/s (short ctx): — (measure) _(felt slightly faster than Qwen Q6, subjectively)_
- Gen tok/s (deep ctx): — (measure)
- Prefill tok/s: — (measure) _(context processing is the slow part on Apple/edge HW)_
- Peak RAM: — (measure)

**Task outcome**
- Wall-clock to working app: ~2h+
- Human nudges / corrections: several (ollama detour, gitignore, frontend, single-thumbnail, thumbnail-serving bug)
- Failures hit: thumbnail fetch / connection-refused / broken-image issues
- Recovered without cloud help: partially
- Cloud rescue needed: yes (one)

**Observations**
- Context processing (prefill) is the slow part on Apple/edge hardware and gets slower as the
  window fills — the main thing to watch if you reproduce this on a smaller rig.

---

## Run N — YYYY-MM-DD
_(copy the block above)_
