---
name: Grado HTML generation inconsistency
description: Why the AI sometimes creates websites and sometimes doesn't for free-tier users
---

# Grado HTML Generation Inconsistency

## The Rule
Free users (or anyone without Anthropic key) → Gemini (GEMINI_API_KEY) or OpenRouter free models.
Claude reliably follows "RULE 1 — ONE COMPLETE HTML FILE, ALWAYS". Gemini/Mistral do not.

**Why:** These models are weaker at inferring "creation intent" from vague prompts. They sometimes respond with plain text instead of HTML.

## Fix Applied
Added explicit keyword trigger list to RULE 1 in the system prompt (api-server/src/routes/anthropic/index.ts):
- Added ⚠️ DÉCLENCHEUR ABSOLU with ~25 trigger words (site, app, jeu, créer, build, etc.)
- Makes it unambiguous for any model that these words = generate HTML

**How to apply:** If users report "AI doesn't always make websites", check if the keyword list covers their use case. Add missing trigger words to the DÉCLENCHEUR ABSOLU list.

## Other Root Causes
- No key configured → immediate error (user must add GEMINI_API_KEY or OPENROUTER_API_KEY)
- freeQuotaReached=true → REGLE ABSOLUE blocks ALL HTML intentionally
- "Detection de Longueur" misclassifies requests (less common with keyword triggers added)
