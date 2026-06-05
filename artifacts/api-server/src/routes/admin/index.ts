import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, users } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

function requireAuth(req: any, res: any): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Non authentifié" });
    return null;
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    res.status(401).json({ error: "Token invalide" });
    return null;
  }
}

// GET /admin/users — list all subscribers
router.get("/users", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

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
