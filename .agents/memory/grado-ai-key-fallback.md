---
name: Grado chat AI key fallback
description: Why the Grado chat "send" button silently did nothing after import, and how the model routing was patched to be resilient.
---

The Grado chat feature (artifacts/api-server/src/routes/anthropic/index.ts) originally assumed
Anthropic/OpenRouter keys were configured (true on its old Railway deployment). On a freshly
imported Replit project with no AI keys set, free-tier users routed to OpenRouter/Gemini and paid/
admin users routed to Anthropic directly — both failed with a clear SSE error, but nothing showed
in the UI in an obvious way, which read to the user as "the button is broken."

**Fix applied:** added a `hasAnthropicKey` check (Replit AI integration proxy vars or a direct
`ANTHROPIC_API_KEY`). When it's false, *all* users (not just free-tier) fall back to the
Gemini/OpenRouter free-model chain, and each fallback candidate now retries a few times with
backoff on 503/429/5xx before moving to the next candidate — free-tier Gemini models are prone to
transient "high demand" 503s.

**Why:** without this, a paid/admin account with no Anthropic key configured got a hard failure
with no fallback at all, and transient Gemini overload errors killed the whole request instead of
retrying.

**Gotcha:** a `GEMINI_API_KEY` can pass basic auth but still have **zero free-tier quota** on its
Google Cloud project (immediate 429 "quota exceeded ... limit: 0"), which looks identical to a
transient outage at first glance. Distinguish by testing the same key against multiple model names
directly against `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` — a
persistent 429 with `limit: 0` across attempts means the key's project needs its free tier enabled
(aistudio.google.com/app/apikey), not a code bug. OpenRouter tends to have a more usable free tier
as an alternative fallback key.

**Vision/image bug found later:** when an image is attached, the code used to force the Anthropic
model unconditionally (even with no Anthropic key, or when Anthropic errors e.g. insufficient
credit) and OpenRouter/Gemini fallbacks explicitly skipped whenever `imageData` was present —
images were silently dropped or the request just errored out with no real fallback. Also, when a
fallback *was* attempted, message content arrays (Anthropic `{type:"image", source:{...}}` blocks)
were being `JSON.stringify`'d into plain text instead of converted to the OpenAI-compatible
`{type:"image_url", image_url:{url:"data:...;base64,..."}}` format Gemini/OpenRouter expect — so
even a "successful" fallback call never actually saw the image.

**Fix:** route to OpenRouter/Gemini whenever there's no Anthropic key (imageData or not), convert
Anthropic-style image blocks to OpenAI `image_url` format for OpenRouter/Gemini calls, and add a
dedicated free vision-capable OpenRouter model fallback list (e.g. `google/gemma-4-26b-a4b-it:free`,
`nvidia/nemotron-nano-12b-v2-vl:free`) since the existing free text-only fallback list
(llama/gpt-oss/lfm) can't process images at all.

**Provider account limits are separate from code bugs:** Anthropic can return "credit balance too
low" (billing), OpenRouter a key-level "Key limit exceeded (total limit)" (spend cap on that key),
and Gemini its per-day free-tier quota — none of these are fixable in code; they require the user to
add credit / raise the key's limit / wait for daily reset. Free OpenRouter `:free` models also hit
frequent transient upstream 429s (shared pool) — this is normal, not a config error.
