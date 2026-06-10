import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { projects, conversations } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

function getUserId(req: any): number | null {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    return decoded.userId ?? null;
  } catch { return null; }
}

// GET /projects
router.get("/", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const rows = await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(projects.createdAt);
  res.json(rows);
});

// POST /projects
router.post("/", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const { name, emoji } = req.body;
  if (!name) { res.status(400).json({ error: "Nom requis" }); return; }
  const [p] = await db.insert(projects).values({ userId, name, emoji: emoji ?? "📁" }).returning();
  res.status(201).json(p);
});

// DELETE /projects/:id
router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const id = Number(req.params.id);
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
  res.status(204).send();
});

// PUT /projects/:id/conversations/:convId — assign conversation to project
router.put("/:id/conversations/:convId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const projectId = Number(req.params.id);
  const convId = Number(req.params.convId);
  const [proj] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
  if (!proj) { res.status(404).json({ error: "Projet introuvable" }); return; }
  await db.update(conversations).set({ projectId }).where(eq(conversations.id, convId));
  res.json({ ok: true });
});

// DELETE /projects/:id/conversations/:convId — remove from project
router.delete("/:id/conversations/:convId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const convId = Number(req.params.convId);
  await db.update(conversations).set({ projectId: null }).where(eq(conversations.id, convId));
  res.json({ ok: true });
});

export default router;
