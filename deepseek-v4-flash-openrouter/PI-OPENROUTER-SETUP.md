# Pi + OpenRouter Setup (cloud run)

How Pi was configured to drive **DeepSeek V4 Flash in the cloud via OpenRouter** for this
session — the counterpart to the local `pi-config/` at the repo root, which drives the same
model on-device with no hosted API.

Same agent (Pi), same task (`../PROMPT.md`), same everything. The only thing that changed is
**where the model runs**: `llama.cpp` on a Mac last time, OpenRouter this time.

## 1. Add an OpenRouter provider to Pi

Add this to `~/.pi/agent/models.json`. OpenRouter speaks the OpenAI-completions API, so no
custom adapter is needed.

```json
{
  "providers": {
    "openrouter": {
      "baseUrl": "https://openrouter.ai/api/v1",
      "api": "openai-completions",
      "apiKey": "OPENROUTER_API_KEY",
      "models": [
        { "id": "deepseek/deepseek-v4-flash", "contextWindow": 262144, "reasoning": true },
        { "id": "moonshotai/kimi-k3",          "contextWindow": 262144, "reasoning": true }
      ]
    }
  }
}
```

`apiKey` is the **name of an environment variable** (or a literal key). Keep your key in
`~/.env` as `OPENROUTER_API_KEY=sk-or-...` and never commit it.

Point Pi at it by default in `~/.pi/agent/settings.json`:

```json
{ "defaultProvider": "openrouter", "defaultModel": "deepseek/deepseek-v4-flash" }
```

Then just run `pi` in the project.

## 2. The provider-routing gotcha (the important part)

DeepSeek V4 Flash on OpenRouter is served by ~19 different providers at **different
quantizations and prices** (fp4, fp8, and "unknown"). If you call the plain model id,
OpenRouter's router picks one **per request** and load-balances — so a single agent run can
bounce across several providers.

Two consequences worth knowing before you trust a cost number:

1. **Quantization is a blend.** One call might land on an fp8 provider, the next on fp4. You
   cannot honestly say "I ran this at 8-bit" under default routing.
2. **Prompt caching breaks.** These models are cheap largely because of prefix caching, and
   caches are **per-provider**. A coding agent resends a growing context every turn; if the
   provider changes, the cache is cold and you pay full input price on the whole context, every
   turn. On a long run that can dominate the bill. This is the "cheapest token, most expensive
   workflow" trap in practice.

**Two ways to control it, both without the OpenRouter dashboard:**

- **Pin in the request body** (the clean fix): add
  `"provider": { "only": ["streamlake"], "allow_fallbacks": false }` to each call. Pi's
  `models.json` can't inject body params, so this needs a tiny local proxy (below) or the
  account-level provider preference.
- **Filter by precision:** `"provider": { "quantizations": ["fp8"], "allow_fallbacks": false }`.

### Optional: local pin-proxy

A ~40-line Node proxy that sits between Pi and OpenRouter and forces one provider (so the cache
holds and the quantization is fixed). Point Pi's `baseUrl` at `http://127.0.0.1:8790/v1`.

```js
// openrouter-pin-proxy.mjs — forces provider.only on every chat request
import http from 'node:http';
import https from 'node:https';
const PORT = 8790;
const PROVIDERS = (process.env.PIN_PROVIDERS || 'streamlake,gmicloud,baidu').split(',');
http.createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    let body = Buffer.concat(chunks);
    if (req.url.includes('/chat/completions') && body.length) {
      try {
        const j = JSON.parse(body.toString('utf8'));
        j.provider = { only: PROVIDERS, allow_fallbacks: false };
        j.usage = { include: true };
        body = Buffer.from(JSON.stringify(j));
      } catch {}
    }
    const headers = { ...req.headers, host: 'openrouter.ai' };
    headers['content-length'] = Buffer.byteLength(body);
    const up = https.request(
      { host: 'openrouter.ai', path: '/api/v1' + req.url.replace(/^\/v1/, ''), method: req.method, headers },
      r => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    up.on('error', e => { res.writeHead(502); res.end(String(e)); });
    up.end(body);
  });
}).listen(PORT, '127.0.0.1', () => console.error(`[pin] :${PORT} -> openrouter only=[${PROVIDERS}]`));
```

Run it: `PIN_PROVIDERS=streamlake node openrouter-pin-proxy.mjs`

**Tradeoff:** pinning one provider gives you cache hits + a fixed quantization, but a single
provider rate-limits faster. Default routing avoids rate limits but scatters your cache and
quantization. Pick per what the run needs. This session ended up on **default routing** to
avoid rate limits, and the extra cost from cache misses is part of the story.

## fp8 providers, cheapest first (checked via the OpenRouter endpoints API)

| Provider | quant | in $/M | cached in $/M |
|---|---|---|---|
| StreamLake | fp8 | 0.09 | 0.018 |
| GMICloud | fp8 | 0.09 | 0.019 |
| Baidu | fp8 | 0.10 | 0.020 |
| Novita / Parasail / WandB | fp8 | 0.14 | 0.028 |

Query it yourself:
`curl -s https://openrouter.ai/api/v1/models/deepseek/deepseek-v4-flash/endpoints | jq '.data.endpoints[] | {provider_name, quantization, pricing}'`

## Run it

```bash
export OPENROUTER_API_KEY=sk-or-...      # or keep it in ~/.env
cd deepseek-v4-flash-openrouter
pi                                        # DeepSeek V4 Flash via OpenRouter (default)
```

Then paste the canonical task from `../PROMPT.md`. Watch cost + provider per call on
`openrouter.ai/activity`.
