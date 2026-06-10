import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { sharedConversations, conversations, messages } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

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

// POST /share/:convId — create or retrieve share link
router.post("/:convId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const convId = Number(req.params.convId);

  const [conv] = await db.select().from(conversations)
    .where(and(eq(conversations.id, convId), eq(conversations.userId, userId))).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation introuvable" }); return; }

  // Return existing share if already exists
  const [existing] = await db.select().from(sharedConversations)
    .where(eq(sharedConversations.conversationId, convId)).limit(1);
  if (existing) {
    res.json({ slug: existing.slug });
    return;
  }

  const slug = crypto.randomBytes(8).toString("hex");
  await db.insert(sharedConversations).values({ conversationId: convId, slug });
  res.json({ slug });
});

// DELETE /share/:convId — remove share link
router.delete("/:convId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const convId = Number(req.params.convId);
  await db.delete(sharedConversations).where(eq(sharedConversations.conversationId, convId));
  res.status(204).send();
});

// GET /share/view/:slug — public read
router.get("/view/:slug", async (req, res) => {
  const [shared] = await db.select().from(sharedConversations)
    .where(eq(sharedConversations.slug, req.params.slug)).limit(1);
  if (!shared) { res.status(404).json({ error: "Lien invalide ou expiré" }); return; }

  const [conv] = await db.select().from(conversations)
    .where(eq(conversations.id, shared.conversationId)).limit(1);
  if (!conv) { res.status(404).json({ error: "Conversation introuvable" }); return; }

  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, shared.conversationId))
    .orderBy(messages.createdAt);

  res.json({
    title: conv.title,
    messages: msgs.map(m => ({ role: m.role, content: m.content, createdAt: m.createdAt })),
  });
});

export default router;
