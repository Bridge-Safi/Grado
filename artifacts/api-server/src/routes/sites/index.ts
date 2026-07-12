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

function legalFooter(slug: string): string {
  return `
<footer style="margin-top:0;padding:14px 20px;background:#0A0A0A;border-top:1px solid #22222c;font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:#8888A8;text-align:center;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center">
  <span>© ${new Date().getFullYear()} — Tous droits réservés</span>
  <span style="opacity:.5">·</span>
  <a href="/api/sites/pub/${slug}/legal" style="color:#8888A8;text-decoration:none" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#8888A8'">Mentions légales</a>
  <span style="opacity:.5">·</span>
  <a href="/api/sites/pub/${slug}/privacy" style="color:#8888A8;text-decoration:none" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#8888A8'">Politique de confidentialité</a>
  <span style="opacity:.5">·</span>
  <span>Site créé avec <a href="https://grado.app" style="color:#7B7BFF;text-decoration:none">Grado</a></span>
</footer>`;
}

function injectFooter(html: string, slug: string): string {
  const footer = legalFooter(slug);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${footer}</body>`);
  return `${html}${footer}`;
}

function legalPageShell(title: string, siteTitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} — ${siteTitle}</title>
<style>
  body { margin:0; background:#050508; color:#E8E8F0; font-family:system-ui,-apple-system,sans-serif; line-height:1.7; }
  .wrap { max-width:680px; margin:0 auto; padding:48px 24px 80px; }
  h1 { font-size:24px; margin-bottom:4px; }
  .sub { color:#8888A8; font-size:13px; margin-bottom:32px; }
  h2 { font-size:16px; margin-top:32px; color:#C8C8E8; }
  p, li { color:#B8B8CC; font-size:14px; }
  a.back { color:#7B7BFF; text-decoration:none; font-size:13px; display:inline-block; margin-bottom:24px; }
</style>
</head>
<body>
  <div class="wrap">
    <a class="back" href="javascript:history.back()">← Retour au site</a>
    <h1>${title}</h1>
    <p class="sub">${siteTitle} · Dernière mise à jour : ${new Date().toLocaleDateString("fr-FR")}</p>
    ${body}
  </div>
</body>
</html>`;
}

// GET /s/:slug — public: serve the site HTML
router.get("/pub/:slug", async (req, res) => {
  const [site] = await db.select().from(sites).where(eq(sites.slug, req.params.slug)).limit(1);
  if (!site) { res.status(404).send("<h1>Site introuvable</h1>"); return; }

  // increment view count (fire and forget)
  db.update(sites).set({ viewCount: site.viewCount + 1 }).where(eq(sites.id, site.id)).catch(() => {});

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "");
  res.send(injectFooter(site.htmlContent, site.slug));
});

// GET /pub/:slug/legal — auto-generated Mentions légales page
router.get("/pub/:slug/legal", async (req, res) => {
  const [site] = await db.select().from(sites).where(eq(sites.slug, req.params.slug)).limit(1);
  if (!site) { res.status(404).send("<h1>Site introuvable</h1>"); return; }

  const body = `
    <h2>Éditeur du site</h2>
    <p>Ce site, « ${site.title} », a été créé et est hébergé via la plateforme Grado (grado.app). L'éditeur du contenu de ce site est l'utilisateur ayant publié ce projet.</p>
    <h2>Hébergement</h2>
    <p>Ce site est hébergé par Grado. Pour toute question relative à l'hébergement ou au contenu, veuillez contacter l'éditeur du site.</p>
    <h2>Propriété intellectuelle</h2>
    <p>Sauf mention contraire, les contenus présents sur ce site sont la propriété de leur éditeur. Toute reproduction sans autorisation est interdite.</p>
    <h2>Responsabilité</h2>
    <p>Grado n'est pas responsable du contenu publié par les utilisateurs sur les sites créés via sa plateforme.</p>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.send(legalPageShell("Mentions légales", site.title, body));
});

// GET /pub/:slug/privacy — auto-generated Politique de confidentialité page
router.get("/pub/:slug/privacy", async (req, res) => {
  const [site] = await db.select().from(sites).where(eq(sites.slug, req.params.slug)).limit(1);
  if (!site) { res.status(404).send("<h1>Site introuvable</h1>"); return; }

  const body = `
    <h2>Collecte des données</h2>
    <p>Ce site, « ${site.title} », peut collecter certaines informations que vous fournissez volontairement via ses formulaires (ex : nom, email), selon les fonctionnalités mises en place par son éditeur.</p>
    <h2>Utilisation des données</h2>
    <p>Les données collectées ne sont utilisées que dans le cadre du fonctionnement du site et ne sont pas revendues à des tiers.</p>
    <h2>Cookies</h2>
    <p>Ce site peut utiliser des cookies techniques nécessaires à son bon fonctionnement.</p>
    <h2>Vos droits</h2>
    <p>Vous pouvez à tout moment demander l'accès, la rectification ou la suppression de vos données auprès de l'éditeur du site.</p>
    <h2>Contact</h2>
    <p>Pour toute question relative à cette politique, contactez l'éditeur du site ou l'équipe Grado via grado.app.</p>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.send(legalPageShell("Politique de confidentialité", site.title, body));
});

export default router;
