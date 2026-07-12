---
name: Imported project DB tables missing
description: After a GitHub import, Postgres tables defined in the Drizzle schema may not actually exist in the dev database yet.
---

Symptom: API routes that query a table (e.g. via Drizzle) fail with a 500 and the server log shows
`error: relation "<table>" does not exist`, even though the schema file for that table is present in
`lib/db/src/schema/`.

**Why:** Importing a project brings in the code/schema but does not automatically run migrations against
the workspace's Postgres instance. Any table added to the schema after the last migration/push simply
isn't there yet.

**How to apply:** Before debugging application code for a "relation does not exist" 500, run
`pnpm run push` (drizzle-kit push) from the db package (e.g. `lib/db`) to sync the schema to the database,
then retry. Don't assume it's a logic bug in the route first.
