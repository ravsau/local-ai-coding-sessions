# Results — Qwen 3.6 27B (M3 Max, 128GB)

Fill this after each run so the [main benchmark table](../README.md#benchmarks-m3-max-128gb)
stays honest. `— (measure)` = not captured on this run.

## Run 1 — 2026-07-11 · uncut session

**Setup**
- Model / quant: Qwen 3.6 27B — Q6_K (MTP GGUF)
- Engine / port: llama.cpp `llama-server` on `:8090`
- Agent: Pi (no MCPs, medium thinking)
- Context set: 100k (`-c 102400`)
- Sampling: `--temp 0.6 --top-p 0.95 --top-k 20 --min-p 0.0`
- Speculative: MTP — `--spec-type draft-mtp --spec-draft-n-max 2`

**Speed / memory**
- Gen tok/s (short ctx): ~17
- Gen tok/s (deep ctx): ~10–12
- Prefill tok/s: ~150
- Draft acceptance (MTP): ~93%
- MTP uplift vs off: ~+44% (~11.8 → ~17 tok/s)
- Peak RAM: ~32 GB idle (23 GB weights + ~9 GB KV) · under load: — (measure)

**Task outcome**
- Wall-clock to working app: ~52 min (uncut)
- Human nudges / corrections: 6 (500 error, run frontend, generation hang/timeout, CSS)
- Failures hit: server crashed on first generation
- Recovered without cloud help: yes
- Cloud rescue needed: no

**Notes for next time**
- Overlay the context setting + live tok/s on screen.
- Timeout hang ("stuck on generating") came from the frontend fetch timeout vs codex's
  ~50s latency — left in as real debugging, not pre-solved.

---

## Run N — YYYY-MM-DD
_(copy the block above)_
