# The Standard Task Prompt

This is the **canonical prompt** for the Local AI Coding Sessions series. Each video gives a
different local model this exact task so the runs are comparable. Copy it verbatim — the point
of the series is *same task, different model*.

> **Task:** build me a full stack app to generate titles for my video idea. Give me 9 titles and
> rank them with a score. and for each title I should be able to generate a thumbnail. but don't
> use any API for LLM or image gen. use codex exec.

Followed by the `codex exec` guidance below (pasted with the task).

---

# Using `codex exec` for LLM Inference + Image Generation (No API)

You (the agent) must NOT call the OpenAI API, Claude API, or any hosted LLM/image
API for generation tasks in this app. Do not import an LLM SDK, do not read or
expect API keys. Instead, shell out to the local `codex` CLI as a subprocess.
Auth lives in the CLI (the user logged in once with their ChatGPT plan); your code
never touches credentials.

## 1. Text generation (LLM inference)

Run `codex exec` as a child process with a read-only sandbox. The model's final
answer arrives on stdout.

```bash
codex exec --sandbox read-only -C . "Summarize this ticket: ..."
```

From code, always pass the prompt as ONE argv element — never interpolate it into
a shell string (prevents shell injection from user input):

```python
import subprocess

def llm(prompt: str) -> str:
    result = subprocess.run(
        ["codex", "exec", "--sandbox", "read-only", "-C", ".", prompt],
        capture_output=True, text=True, timeout=300,
    )
    return result.stdout.strip()  # stdout = the model's final answer
```

```js
const { execFileSync } = require("node:child_process");
const answer = execFileSync(
  "codex", ["exec", "--sandbox", "read-only", "-C", ".", prompt],
  { encoding: "utf8", timeout: 300_000 }
).trim();
```

Parse/consume `stdout` directly; treat a non-zero exit code as a failed generation.

## 2. Image generation

Ask Codex to generate the image with `$imagegen` and save it to a known path.
This needs write access, so use `--sandbox workspace-write`, and use `-C <dir>`
to control where the file lands. Codex writes the image to disk; your app reads
the file — nothing comes back on stdout except status text.

```bash
codex exec --sandbox workspace-write -C . \
  '$imagegen a red fox in snow; save it to out.png'
```

```python
def gen_image(prompt: str, out_path: str = "out.png") -> str:
    subprocess.run(
        ["codex", "exec", "--sandbox", "workspace-write", "-C", ".",
         f"$imagegen {prompt}; save it to {out_path}"],
        capture_output=True, text=True, timeout=600,
    )
    if not os.path.exists(out_path):
        raise RuntimeError("image generation failed")
    return out_path  # read the file, use it in your app
```

## Rules & gotchas (enforce all of these)

1. **Prereq:** the `codex` CLI must be installed and logged in once (ChatGPT plan
   or API key) — auth lives in the CLI, not in app code. If `codex` is missing,
   surface a clear setup message; do not fall back to an API.
2. **Injection safety:** the prompt goes in as a single argv element via a
   subprocess arg list (`execFile` / `subprocess.run` with a list). Never build a
   shell string from user input.
3. **Sandbox scope:** `read-only` for text; `workspace-write` only when Codex
   must save a file (image gen). Set `-C <dir>` so files land where the app
   expects them.
4. **Cost control:** image generation spends general Codex usage — gate it behind
   an explicit opt-in flag in the app, and fall back to a local placeholder image
   if the call fails or times out.
5. **One call per request:** run `codex exec` once per generation request as a
   child process; don't keep a long-lived session.
