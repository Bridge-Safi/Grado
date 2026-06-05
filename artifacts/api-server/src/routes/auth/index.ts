import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const isAdmin = (email: string) => !!ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL;

// POST /auth/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Nom, email et mot de passe requis" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Le mot de passe doit faire au moins 6 caractères" });
    return;
  }

  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Cet email est déjà utilisé" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // 48h free trial
  const trialEndsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const [user] = await db.insert(users).values({
    name,
    email: email.toLowerCase(),
    passwordHash,
    plan: "gratuit",
    trialEndsAt,
  }).returning();

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt, isAdmin: isAdmin(user.email) },
  });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email et mot de passe requis" });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt, isAdmin: isAdmin(user.email) },
  });
});

// POST /auth/change-password
router.post("/change-password", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  let userId: number;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch {
    res.status(401).json({ error: "Token invalide" });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Mots de passe requis" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères" });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Mot de passe actuel incorrect" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));

  res.json({ ok: true });
});

// PUT /api/auth/plan
router.put("/plan", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return; }
  let userId: number;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch { res.status(401).json({ error: "Token invalide" }); return; }

  const { plan } = req.body;
  const allowed = ["gratuit", "hacker", "pro"];
  if (!plan || !allowed.includes(plan)) { res.status(400).json({ error: "Plan invalide" }); return; }

  // 48h trial for paid plans, immediate for free
  const trialEndsAt = plan !== "gratuit" ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null;

  const [updated] = await db.update(users)
    .set({ plan, trialEndsAt })
    .where(eq(users.id, userId))
    .returning();

  res.json({ id: updated.id, name: updated.name, email: updated.email, plan: updated.plan, trialEndsAt: updated.trialEndsAt, isAdmin: isAdmin(updated.email) });
});

// GET /auth/me
router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
    res.json({ id: user.id, name: user.name, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt, isAdmin: isAdmin(user.email) });
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
});

export default router;
