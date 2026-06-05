import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, sites } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

function requireAuth(req: any, res: any): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return null; }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch { res.status(401).json({ error: "Token invalide" }); return null; }
}

// POST /sites — publish a site
router.post("/", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { title, htmlContent } = req.body;
  if (!htmlContent) { res.status(400).json({ error: "htmlContent requis" }); return; }

  const base = title ? slugify(title) : "site";
  const slug = `${base}-${randomSuffix()}`;

  const [site] = await db.insert(sites).values({
    userId,
    slug,
    title: title || "Mon site Grado",
    htmlContent,
  }).returning();

  res.status(201).json({
    id: site.id,
    slug: site.slug,
    title: site.title,
    url: `/s/${site.slug}`,
    createdAt: site.createdAt,
  });
});

// GET /sites — list my sites
router.get("/", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const mySites = await db
    .select({ id: sites.id, slug: sites.slug, title: sites.title, viewCount: sites.viewCount, createdAt: sites.createdAt })
    .from(sites)
    .where(eq(sites.userId, userId))
    .orderBy(desc(sites.createdAt));

  res.json(mySites);
});

// DELETE /sites/:slug — delete a site
router.delete("/:slug", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [existing] = await db.select().from(sites).where(eq(sites.slug, req.params.slug)).limit(1);
  if (!existing || existing.userId !== userId) { res.status(404).json({ error: "Site introuvable" }); return; }

  await db.delete(sites).where(eq(sites.slug, req.params.slug));
  res.json({ ok: true });
});

// GET /s/:slug — public: serve the site HTML
router.get("/pub/:slug", async (req, res) => {
  const [site] = await db.select().from(sites).where(eq(sites.slug, req.params.slug)).limit(1);
  if (!site) { res.status(404).send("<h1>Site introuvable</h1>"); return; }

  // increment view count (fire and forget)
  db.update(sites).set({ viewCount: site.viewCount + 1 }).where(eq(sites.id, site.id)).catch(() => {});

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "");
  res.send(site.htmlContent);
});

export default router;
