import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, users } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

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

export default router;
