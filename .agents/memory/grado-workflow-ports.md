---
name: Grado workflow port conflict
description: Old hand-configured workflows conflict with Replit artifact-managed workflows; how it was resolved.
---

## Rule
Remove "Start application" and "API Server" workflows from `.replit` — they conflict with the artifact-managed `artifacts/grado: web` and `artifacts/api-server: API Server` workflows. Only artifact workflows should run.

**Why:** Both old and new workflows tried to bind the same ports (23509 for frontend, 5000 for API). The old ones start first, causing the artifact workflows to fail. The artifact system injects $PORT automatically — do not hardcode it.

**How to apply:**
- Use `removeWorkflow({ name: "Start application" })` and `removeWorkflow({ name: "API Server" })` via CodeExecution if they reappear.
- If a process still holds a port after removal, `lsof -i :<port>` to find PID then `kill -9 <PID>`.
- The Vite proxy in `artifacts/grado/vite.config.ts` must target the API server port. The artifact API server runs on port 8080 (Replit assigns this via $PORT). Config: `target: \`http://localhost:${process.env.API_PORT ?? 8080}\``.
