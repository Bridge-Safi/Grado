import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { userSettings } from "@workspace/db";
import { eq } from "drizzle-orm";

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

// GET /settings — return user settings (instructions + memory)
router.get("/", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  res.json({
    customInstructions: row?.customInstructions ?? "",
    memoryNotes: row?.memoryNotes ?? "",
  });
});

// PUT /settings — upsert settings
router.put("/", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const { customInstructions, memoryNotes } = req.body;
  const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (existing.length > 0) {
    const [updated] = await db.update(userSettings)
      .set({
        ...(customInstructions !== undefined ? { customInstructions } : {}),
        ...(memoryNotes !== undefined ? { memoryNotes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();
    res.json({ customInstructions: updated.customInstructions ?? "", memoryNotes: updated.memoryNotes ?? "" });
  } else {
    const [created] = await db.insert(userSettings)
      .values({ userId, customInstructions: customInstructions ?? null, memoryNotes: memoryNotes ?? null })
      .returning();
    res.json({ customInstructions: created.customInstructions ?? "", memoryNotes: created.memoryNotes ?? "" });
  }
});

export default router;
