#!/bin/zsh
# Qwen3.6-27B Q6_K (MTP) via llama.cpp for Hermes + Pi agents
# 100k context, MTP speculative decoding (needs BOTH --spec-type AND --spec-draft-n-max),
# f16 KV cache (Metal fast path — bf16 falls to slow kernels, quantized KV risks quality),
# Qwen official sampling defaults, preserve_thinking for agent multi-turn.
# Do NOT add --no-mmap on Mac (unified memory wants mmap).
# If slow: check `vm_stat | grep wired` — force-killed Metal procs leak wired memory; reboot fixes.
set -e

MODEL=$(echo $HOME/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-MTP-GGUF/snapshots/*/Qwen3.6-27B-Q6_K.gguf)
PORT=8090

exec llama-server \
  -m "$MODEL" \
  --alias qwen3.6-27b-q6k-mtp \
  --port $PORT \
  --host 127.0.0.1 \
  -c 102400 \
  -ngl 99 \
  -fa on \
  -np 1 \
  --cache-type-k f16 \
  --cache-type-v f16 \
  --spec-type draft-mtp \
  --spec-draft-n-max 2 \
  --temp 0.6 --top-p 0.95 --top-k 20 --min-p 0.0 \
  --chat-template-kwargs '{"preserve_thinking":true}' \
  --jinja
