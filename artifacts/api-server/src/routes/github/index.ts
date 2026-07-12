import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";

function requireAuth(req: any, res: any): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return null; }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch { res.status(401).json({ error: "Token invalide" }); return null; }
}

function baseUrl(req: any): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, "");
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  const host = req.get("x-forwarded-host") || req.get("host");
  return `${proto}://${host}`;
}

function slugifyRepo(str: string): string {
  return (str || "site-grado")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "site-grado";
}

// GET /github/status — is this account connected?
router.get("/status", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  res.json({ connected: !!user.githubAccessToken, username: user.githubUsername || null });
});

// GET /github/connect?token=<jwt> — redirect to GitHub's OAuth consent screen
router.get("/connect", async (req, res) => {
  const token = String(req.query.token || "");
  let userId: number;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch {
    res.status(401).send("Session invalide, reconnecte-toi à Grado puis réessaie.");
    return;
  }
  if (!GITHUB_CLIENT_ID) {
    res.status(503).send("Connexion GitHub non configurée côté serveur.");
    return;
  }
  const state = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "10m" });
  const redirectUri = `${baseUrl(req)}/api/github/callback`;
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "repo read:user");
  authorizeUrl.searchParams.set("state", state);
  res.redirect(authorizeUrl.toString());
});

// GET /github/callback — GitHub redirects here after consent
router.get("/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  const front = baseUrl(req);
  if (!code || !state) { res.redirect(`${front}/chat?github=error`); return; }

  let userId: number;
  try {
    const decoded = jwt.verify(state, JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch {
    res.redirect(`${front}/chat?github=error`);
    return;
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${front}/api/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_description || "Échange de code échoué");

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "Grado-App" },
    });
    const ghUser = await userRes.json();

    await db.update(users)
      .set({ githubAccessToken: tokenData.access_token, githubUsername: ghUser.login })
      .where(eq(users.id, userId));

    res.redirect(`${front}/chat?github=connected`);
  } catch (err) {
    console.error("github oauth callback error:", err);
    res.redirect(`${front}/chat?github=error`);
  }
});

// POST /github/disconnect
router.post("/disconnect", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  await db.update(users).set({ githubAccessToken: null, githubUsername: null }).where(eq(users.id, userId));
  res.json({ ok: true });
});

async function getGithubToken(userId: number): Promise<string | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user?.githubAccessToken || null;
}

// GET /github/repos — list the connected account's repos
router.get("/repos", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const ghToken = await getGithubToken(userId);
  if (!ghToken) { res.status(400).json({ error: "GitHub non connecté" }); return; }

  try {
    const r = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: { Authorization: `Bearer ${ghToken}`, "User-Agent": "Grado-App" },
    });
    if (!r.ok) throw new Error("Erreur GitHub API");
    const repos = await r.json();
    res.json(repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      htmlUrl: repo.html_url,
    })));
  } catch (err) {
    console.error("github repos error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des dépôts" });
  }
});

// POST /github/export — push the generated site to a brand-new repo
router.post("/export", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const ghToken = await getGithubToken(userId);
  if (!ghToken) { res.status(400).json({ error: "GitHub non connecté" }); return; }

  const { html, repoName } = req.body;
  if (!html) { res.status(400).json({ error: "html requis" }); return; }
  const name = slugifyRepo(repoName);
  const ghHeaders = { Authorization: `Bearer ${ghToken}`, "User-Agent": "Grado-App", "Content-Type": "application/json" };

  try {
    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: ghHeaders,
      body: JSON.stringify({ name, description: "Site créé avec Grado", auto_init: true }),
    });
    const repo = await createRes.json();
    if (!createRes.ok) throw new Error(repo.message || "Impossible de créer le dépôt");

    // wait a moment for auto_init commit to exist, then fetch its sha to update index.html
    const owner = repo.owner.login;
    let sha: string | undefined;
    try {
      const existing = await fetch(`https://api.github.com/repos/${owner}/${repo.name}/contents/index.html`, { headers: ghHeaders });
      if (existing.ok) sha = (await existing.json()).sha;
    } catch {}

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo.name}/contents/index.html`, {
      method: "PUT",
      headers: ghHeaders,
      body: JSON.stringify({
        message: "Site généré par Grado",
        content: Buffer.from(html, "utf-8").toString("base64"),
        ...(sha ? { sha } : {}),
      }),
    });
    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || "Impossible de pousser le fichier");
    }

    res.json({ ok: true, repoUrl: repo.html_url, fullName: repo.full_name });
  } catch (err: any) {
    console.error("github export error:", err);
    res.status(500).json({ error: err.message || "Erreur lors de l'export GitHub" });
  }
});

// GET /github/import/:owner/:repo — pull a repo's site (index.html) back into Grado
router.get("/import/:owner/:repo", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const ghToken = await getGithubToken(userId);
  if (!ghToken) { res.status(400).json({ error: "GitHub non connecté" }); return; }

  const { owner, repo } = req.params;
  const ghHeaders = { Authorization: `Bearer ${ghToken}`, "User-Agent": "Grado-App" };

  try {
    const candidates = ["index.html", "public/index.html", "src/index.html"];
    let html: string | null = null;
    let foundPath: string | null = null;
    for (const path of candidates) {
      const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers: ghHeaders });
      if (r.ok) {
        const data = await r.json();
        html = Buffer.from(data.content, "base64").toString("utf-8");
        foundPath = path;
        break;
      }
    }
    if (!html) { res.status(404).json({ error: "Aucun fichier index.html trouvé dans ce dépôt" }); return; }
    res.json({ html, path: foundPath });
  } catch (err) {
    console.error("github import error:", err);
    res.status(500).json({ error: "Erreur lors de l'import GitHub" });
  }
});

export default router;
