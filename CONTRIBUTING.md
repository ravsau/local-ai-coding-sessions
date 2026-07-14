# Contributing

This repo is the code + support thread for the [CloudYeti](https://youtube.com/@CloudYeti)
"local AI coding sessions" videos. Feedback is genuinely wanted — here's how to help.

## Open an issue if…

- **Something in a FAQ or README is wrong or out of date.** Say which file and what's off.
- **You hit a setup problem** reproducing a run (llama.cpp flags, the `ds4`/dwarfstar engine,
  Pi config, `codex exec`). Include your hardware, OS, model + quant, and the exact error.
- **You have benchmark numbers** for one of these models on your own machine — tok/s, prefill,
  peak RAM, context. Real numbers on other rigs are useful; I'll credit them.
- **You want a model or coding agent tested** on the same task. Name the model/agent and why.

## Open a PR if…

- You have a fix for one of the apps (`deepseek-v4-flash/` or `qwen-3.6-27b/`).
- You want to correct or expand a FAQ answer.
- You have a cleaner config that keeps a local model on-task.

## The task is fixed on purpose

Every session uses the **same** prompt ([PROMPT.md](PROMPT.md)) so different models/agents are
comparable. PRs that change an app to solve the task "better" are welcome as their own thing,
but the recorded runs intentionally leave the failures in — that's the point of the series.

## Not sure?

Just open an issue and ask. Questions about setup are exactly what this repo is for.
