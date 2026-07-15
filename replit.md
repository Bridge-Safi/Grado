# Grado

An AI chat / site-builder web app with an Express API and a React frontend, imported from GitHub (also deployed separately on Railway).

## Run & Operate

- Two Replit workflows are configured and running: `Start application` (Vite frontend, port 23509) and `API Server` (Express, port 5000).
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (currently Replit's built-in dev Postgres; schema has been pushed — see Gotchas)
- After a fresh import/clone, run `pnpm install` then `pnpm --filter @workspace/db run push` before starting the workflows — a new environment has no `node_modules` and an empty/unmigrated dev database.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `GRADO_OFFLINE` (env var, shared) gates public signup/login in `artifacts/api-server/src/routes/auth/index.ts`. It defaults to `"1"` (blocked, admin-only) in code, but is now explicitly set to `"0"` here on Replit so clients can register and log in.
- Root `package.json` sets `"pnpm": { "onlyBuiltDependencies": ["esbuild"] }` so esbuild's postinstall script (native binary download) actually runs — without it, `vite`/`build.mjs` fail with "not found" after `pnpm install`.
- The project is also deployed on Railway with its own Postgres database. The `DATABASE_URL` the user has (using host `postgres.railway.internal`) is Railway's **private network** address and is not reachable from Replit. Replit is currently running against its own built-in dev Postgres (schema pushed, but empty — no data from the Railway deployment). To point Replit at the real Railway data, get the **public/proxy** connection string from Railway's Postgres service → "Connect" tab → "Public Network", then set it as `DATABASE_URL`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
