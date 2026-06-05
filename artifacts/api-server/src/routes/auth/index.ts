import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

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
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt },
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
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt },
  });
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
    res.json({ id: user.id, name: user.name, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt });
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
});

export default router;
