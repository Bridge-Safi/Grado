---
name: Grado monthly creation quota
description: How the monthly creation quota is enforced across all plans in Grado, and the video weighting rule.
---

The Grado app (artifacts/api-server) tracks "creations" per month by scanning assistant message
content for code blocks / `[GRADO_MUSIC]` / `[GRADO_IMAGE]` / `[GRADO_VIDEO]` tags — there's no
separate credits ledger. Plan limits: gratuit 5, essentiel 30, createur 150, fusion 500, elite
unlimited.

**Decision:** video generation is never free (gratuit plan is blocked outright, no trial videos),
and on every paid plan a video costs 3 creations against the monthly limit instead of 1. This is
centralized in `artifacts/api-server/src/lib/quota.ts` (`creationWeight`, `getMonthlyQuotaStatus`,
`PLAN_LIMITS`) and reused by the `/auth/usage` endpoint, the chat route's quota gate, and the
`/media/video` route's pre-check.

**Why:** before this, only the free plan had any server-side enforcement at all — paid plans
(essentiel/createur/fusion) had no quota check in the chat route, and video for paid users was
completely unmetered even though it's by far the most expensive generation type. The business
decided video must always cost more than a code/image/music creation, and free tier should not
subsidize video costs at all.

**How to apply:** if a new media type gets its own per-type cost multiplier in the future, add it
to `creationWeight()` in `lib/quota.ts` rather than duplicating counting logic in individual routes
— three call sites already depend on that single source of truth.

**Gotcha:** in `/media/video`, the plan/quota check must run *before* the `FAL_KEY` missing check,
or a free/over-quota user sees a generic "server not configured" error instead of the real
upgrade-prompt message.
