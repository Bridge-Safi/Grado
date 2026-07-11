import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, users, conversations, messages, mediaGenerations, userSettings } from "@workspace/db";
import { desc, eq, inArray } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Non authentifié" });
    return false;
  }
  let userId: number;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch {
    res.status(401).json({ error: "Token invalide" });
    return false;
  }

  if (!ADMIN_EMAIL) {
    res.status(503).json({ error: "Admin non configuré" });
    return false;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Accès refusé" });
    return false;
  }

  return true;
}

// GET /admin/users — list all subscribers (admin only)
router.get("/users", async (req, res) => {
  const ok = await requireAdmin(req, res);
  if (!ok) return;

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      plan: users.plan,
      trialEndsAt: users.trialEndsAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  res.json({ count: allUsers.length, users: allUsers });
});

// DELETE /admin/users/:id — supprimer un client et toutes ses données (admin uniquement)
router.delete("/users/:id", async (req, res) => {
  const ok = await requireAdmin(req, res);
  if (!ok) return;

  const targetId = Number(req.params.id);
  if (!Number.isFinite(targetId)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) {
    res.status(404).json({ error: "Client introuvable" });
    return;
  }
  if (target.email.toLowerCase() === ADMIN_EMAIL) {
    res.status(400).json({ error: "Impossible de supprimer le compte admin" });
    return;
  }

  try {
    const convs = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.userId, targetId));
    const convIds = convs.map((c) => c.id);
    if (convIds.length) {
      await db.delete(messages).where(inArray(messages.conversationId, convIds));
      await db.delete(mediaGenerations).where(inArray(mediaGenerations.conversationId, convIds));
      await db.delete(conversations).where(eq(conversations.userId, targetId));
    }
    try {
      await db.delete(userSettings).where(eq(userSettings.userId, targetId));
    } catch {}
    await db.delete(users).where(eq(users.id, targetId));
    res.json({ ok: true });
  } catch (err) {
    console.error("admin delete user error:", err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

export default router;
