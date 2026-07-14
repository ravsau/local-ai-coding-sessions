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

**Notes for next time**
- Put the context setting on screen (viewers flagged the 32k choice).
- Lock the deliverable wording to match the series ("9 titles + score, one thumbnail per
  title") — this run drifted toward "9 thumbnail variations."
- Capture tok/s + prefill + peak RAM this time so the table isn't blank.

---

## Run N — YYYY-MM-DD
_(copy the block above)_
