import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail, sendVerificationEmail, sendReferralRewardEmail } from "../../lib/email.js";

const router = Router();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "fallback-secret-change-me") {
  console.warn("⚠️  JWT_SECRET non défini ou insécurisé — configure JWT_SECRET dans les variables d'environnement !");
}
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "noreply@grado.safi-bridge.ma";
const isAdmin = (email: string) => !!ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL;
const GRADO_OFFLINE = (process.env.GRADO_OFFLINE ?? "0") !== "0";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function sendResetEmail(to: string, code: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("Service email non configuré. Contactez l'administrateur.");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject: "Grado — Code de réinitialisation",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0D0D12;color:#fff;border-radius:12px">
          <h2 style="color:#5B5BD6;margin-bottom:8px">Réinitialisation de mot de passe</h2>
          <p style="color:#8888A8;margin-bottom:24px">Voici ton code de vérification. Il expire dans 15 minutes.</p>
          <div style="background:#111118;border:1px solid #5B5BD6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#fff;font-family:monospace">${code}</span>
          </div>
          <p style="color:#4a4a5a;font-size:12px">Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>
        </div>
      `,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erreur envoi email: ${err}`);
  }
}

// POST /auth/register
router.post("/register", async (req, res) => {
  if (GRADO_OFFLINE) {
    res.status(403).json({ error: "🚀 Grado arrive très bientôt ! Les inscriptions ne sont pas encore ouvertes." });
    return;
  }
  const { name, email, password, referralCode: refCode } = req.body;
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

  // Vérifie le code de parrainage si fourni
  let referrerId: number | undefined;
  if (refCode) {
    const [referrer] = await db.select({ id: users.id, name: users.name, email: users.email })
      .from(users).where(eq(users.referralCode, refCode.toUpperCase())).limit(1);
    if (referrer) referrerId = referrer.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // Génère un code unique de vérification email (6 chiffres, valide 24h)
  const verifCode = generateCode();
  const verifExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const verifHash = await bcrypt.hash(verifCode, 8);

  // Génère un code de parrainage unique
  let referralCode = generateReferralCode();
  // S'assurer de l'unicité (rare mais possible)
  const codeExists = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, referralCode)).limit(1);
  if (codeExists.length > 0) referralCode = generateReferralCode() + Math.random().toString(36).slice(2, 4).toUpperCase();

  const [user] = await db.insert(users).values({
    name,
    email: email.toLowerCase(),
    passwordHash,
    plan: "gratuit",
    trialEndsAt,
    emailVerified: false,
    verificationCode: verifHash,
    verificationCodeExpires: verifExpires,
    referralCode,
    referredBy: referrerId,
  }).returning();

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

  // Emails fire-and-forget
  sendWelcomeEmail(user.email, user.name).catch(() => {});
  sendVerificationEmail(user.email, user.name, verifCode).catch(() => {});

  // Récompense le parrain : incrémente referralCount + email de félicitations
  if (referrerId) {
    const [referrer] = await db.select({ referralCount: users.referralCount, name: users.name, email: users.email })
      .from(users).where(eq(users.id, referrerId)).limit(1);
    if (referrer) {
      await db.update(users)
        .set({ referralCount: (referrer.referralCount ?? 0) + 1 })
        .where(eq(users.id, referrerId));
      sendReferralRewardEmail(referrer.email, referrer.name, user.name).catch(() => {});
    }
  }

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt, isAdmin: isAdmin(user.email), emailVerified: false, referralCode: user.referralCode },
  });
});

// POST /auth/verify-email
router.post("/verify-email", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return; }
  let userId: number;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch { res.status(401).json({ error: "Token invalide" }); return; }

  const { code } = req.body;
  if (!code) { res.status(400).json({ error: "Code requis" }); return; }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  if (user.emailVerified) { res.json({ ok: true, alreadyVerified: true }); return; }
  if (!user.verificationCode || !user.verificationCodeExpires) {
    res.status(400).json({ error: "Aucun code en attente. Renvoie le code." }); return;
  }
  if (new Date() > user.verificationCodeExpires) {
    res.status(400).json({ error: "Code expiré. Demande un nouveau code." }); return;
  }

  const valid = await bcrypt.compare(code.toString(), user.verificationCode);
  if (!valid) { res.status(400).json({ error: "Code incorrect" }); return; }

  await db.update(users)
    .set({ emailVerified: true, verificationCode: null, verificationCodeExpires: null })
    .where(eq(users.id, userId));

  res.json({ ok: true });
});

// POST /auth/resend-verification
router.post("/resend-verification", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return; }
  let userId: number;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch { res.status(401).json({ error: "Token invalide" }); return; }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Introuvable" }); return; }
  if (user.emailVerified) { res.json({ ok: true }); return; }

  const code = generateCode();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const codeHash = await bcrypt.hash(code, 8);
  await db.update(users).set({ verificationCode: codeHash, verificationCodeExpires: expires }).where(eq(users.id, userId));
  sendVerificationEmail(user.email, user.name, code).catch(() => {});
  res.json({ ok: true });
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

  if (GRADO_OFFLINE && !isAdmin(user.email)) {
    res.status(403).json({ error: "🚀 Grado arrive très bientôt ! L'accès n'est pas encore ouvert au public." });
    return;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt, isAdmin: isAdmin(user.email), emailVerified: user.emailVerified ?? false, referralCode: user.referralCode },
  });
});

// POST /auth/request-password-reset — step 1: send 6-digit code by email
router.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email requis" });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

  if (user) {
    const code = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    const codeHash = await bcrypt.hash(code, 8);
    await db.update(users)
      .set({ resetToken: codeHash, resetTokenExpires: expires })
      .where(eq(users.id, user.id));
    try {
      await sendResetEmail(user.email, code);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
      return;
    }
  }

  res.json({ ok: true, message: "Si ce compte existe, un email a été envoyé." });
});

// POST /auth/reset-password — step 2: verify code + set new password
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: "Email, code et nouveau mot de passe requis" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Le mot de passe doit faire au moins 6 caractères" });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user || !user.resetToken || !user.resetTokenExpires) {
    res.status(400).json({ error: "Code invalide ou expiré" });
    return;
  }

  if (new Date() > user.resetTokenExpires) {
    await db.update(users).set({ resetToken: null, resetTokenExpires: null }).where(eq(users.id, user.id));
    res.status(400).json({ error: "Ce code a expiré. Recommence depuis le début." });
    return;
  }

  const validCode = await bcrypt.compare(code, user.resetToken);
  if (!validCode) {
    res.status(400).json({ error: "Code incorrect" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(users)
    .set({ passwordHash: newHash, resetToken: null, resetTokenExpires: null })
    .where(eq(users.id, user.id));

  res.json({ ok: true });
});

// POST /auth/change-password (authenticated)
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

// DELETE /auth/me — suppression de compte (authentifié)
router.delete("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return; }
  let userId: number;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch { res.status(401).json({ error: "Token invalide" }); return; }

  const { password } = req.body;
  if (!password) { res.status(400).json({ error: "Mot de passe requis pour confirmer la suppression" }); return; }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  // L'admin ne peut pas se supprimer lui-même via cette route
  if (isAdmin(user.email)) { res.status(403).json({ error: "Le compte administrateur ne peut pas être supprimé via cette route." }); return; }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Mot de passe incorrect" }); return; }

  await db.delete(users).where(eq(users.id, userId));
  res.json({ ok: true });
});

// PUT /api/auth/plan
router.put("/plan", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return; }
  let userId: number;
  let userEmail: string;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number; email: string };
    userId = decoded.userId;
    userEmail = decoded.email;
  } catch { res.status(401).json({ error: "Token invalide" }); return; }

  const { plan } = req.body;
  const allowed = ["gratuit", "essentiel", "createur", "fusion", "elite"];
  if (!plan || !allowed.includes(plan)) { res.status(400).json({ error: "Plan invalide" }); return; }

  const adminAllowed = isAdmin(userEmail);
  if (!adminAllowed && plan !== "gratuit") {
    res.status(403).json({ error: "Paiement requis. Utilisez le système de paiement pour souscrire à un plan payant." });
    return;
  }

  const trialEndsAt = null;
  const [updated] = await db.update(users)
    .set({ plan, trialEndsAt })
    .where(eq(users.id, userId))
    .returning();

  res.json({ id: updated.id, name: updated.name, email: updated.email, plan: updated.plan, trialEndsAt: updated.trialEndsAt, isAdmin: isAdmin(updated.email) });
});

// GET /auth/usage — retourne le nombre de créations du jour en cours
router.get("/usage", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return; }
  let userId: number;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch { res.status(401).json({ error: "Token invalide" }); return; }

  const [user] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Introuvable" }); return; }

  try {
    const { getMonthlyQuotaStatus } = await import("../../lib/quota.js");
    const { used, limit } = await getMonthlyQuotaStatus(userId, user.plan);
    res.json({ plan: user.plan, used, limit });
  } catch (err) {
    res.status(500).json({ error: "Erreur" });
  }
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
    res.json({ id: user.id, name: user.name, email: user.email, plan: user.plan, trialEndsAt: user.trialEndsAt, isAdmin: isAdmin(user.email), emailVerified: user.emailVerified ?? false, referralCode: user.referralCode });
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
});

export default router;
