# Local AI Coding Sessions

Full-stack apps built **entirely by local LLMs** on a 128GB Mac — no cloud model, no ChatGPT/Claude rescue — recorded uncut for CloudYeti. Each folder is one session: the same task ("build a video title + thumbnail generator") given to a different local model, so you can compare what actually happens.

| Session | Model | Harness | Recording |
|---------|-------|---------|-----------|
| [`deepseek-v4-flash/`](deepseek-v4-flash/) | DeepSeek V4 Flash (dwarfstar) | Pi | [What Local AI Coding Actually Feels Like on a 128GB Mac](https://youtu.be/hVpOxnESKVs) |
| [`qwen-3.6-27b/`](qwen-3.6-27b/) | Qwen 3.6 27B Q6 (llama.cpp) | Pi | [Can Qwen 3.6 27B Replace Claude Code? Full Uncut Session](https://youtu.be/6NhLP_YGZVw) |

Same task, same rig, different model — the point is the honest, uncut run: where it fails, how it recovers, and how fast it really is. Each folder has its own README with the exact prompt and setup.

## Why local

No API keys in app code. Generation in these apps shells out to the local `codex` CLI; the models that *wrote* the code ran fully on-device via llama.cpp / Pi on a 128GB Mac.

— [CloudYeti](https://youtube.com/@CloudYeti) · [cloudyeti.io](https://cloudyeti.io)
