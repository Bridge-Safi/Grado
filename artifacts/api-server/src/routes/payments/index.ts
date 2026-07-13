import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { users, paymentRequests } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { sendPlanActivatedEmail } from "../../lib/email.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

const PLAN_PRICES: Record<string, number> = {
  essentiel: 39,
  createur: 99,
  fusion: 189,
  elite: 359,
};

function getUserId(req: any): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

async function requireAdmin(req: any, res: any): Promise<number | null> {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return null; }
  if (!ADMIN_EMAIL) { res.status(503).json({ error: "Admin non configuré" }); return null; }
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Accès refusé" }); return null;
  }
  return userId;
}

// POST /payments/request — create a payment request
router.post("/request", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }

  const { plan } = req.body;
  if (!plan || !PLAN_PRICES[plan]) {
    res.status(400).json({ error: "Plan invalide" }); return;
  }

  // Cancel existing pending requests for this user
  await db.update(paymentRequests)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(paymentRequests.userId, userId), eq(paymentRequests.status, "pending")));

  const reference = `GRADO-${userId}-${plan.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const amount = PLAN_PRICES[plan];

  const [request] = await db.insert(paymentRequests).values({
    userId,
    plan,
    amount,
    reference,
    method: "virement",
    status: "pending",
  }).returning();

  res.status(201).json(request);
});

// GET /payments/my — get current user's payment requests
router.get("/my", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }

  const requests = await db.select()
    .from(paymentRequests)
    .where(eq(paymentRequests.userId, userId))
    .orderBy(desc(paymentRequests.createdAt))
    .limit(10);

  res.json(requests);
});

// GET /payments/admin — get all payment requests (admin)
router.get("/admin", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const requests = await db
    .select({
      id: paymentRequests.id,
      userId: paymentRequests.userId,
      plan: paymentRequests.plan,
      amount: paymentRequests.amount,
      reference: paymentRequests.reference,
      method: paymentRequests.method,
      status: paymentRequests.status,
      note: paymentRequests.note,
      createdAt: paymentRequests.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(paymentRequests)
    .leftJoin(users, eq(paymentRequests.userId, users.id))
    .orderBy(desc(paymentRequests.createdAt));

  res.json(requests);
});

// PUT /payments/admin/:id/approve — approve a payment and activate plan
router.put("/admin/:id/approve", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id)).limit(1);
  if (!request) { res.status(404).json({ error: "Demande introuvable" }); return; }

  await db.update(paymentRequests)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(paymentRequests.id, id));

  await db.update(users)
    .set({ plan: request.plan, trialEndsAt: null })
    .where(eq(users.id, request.userId));

  // Email de confirmation au client — fire-and-forget
  const [activatedUser] = await db.select({ email: users.email, name: users.name })
    .from(users).where(eq(users.id, request.userId)).limit(1);
  if (activatedUser) {
    sendPlanActivatedEmail(activatedUser.email, activatedUser.name, request.plan).catch(() => {});
  }

  res.json({ ok: true, plan: request.plan });
});

// PUT /payments/admin/:id/reject — reject a payment
router.put("/admin/:id/reject", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const { note } = req.body;
  await db.update(paymentRequests)
    .set({ status: "rejected", note: note || null, updatedAt: new Date() })
    .where(eq(paymentRequests.id, id));

  res.json({ ok: true });
});

// PUT /payments/admin/user/:userId/plan — admin manually sets a user's plan
router.put("/admin/user/:userId/plan", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const targetId = parseInt(req.params.userId);
  if (isNaN(targetId)) { res.status(400).json({ error: "ID invalide" }); return; }

  const { plan } = req.body;
  const allowed = ["gratuit", "essentiel", "createur", "fusion", "elite"];
  if (!plan || !allowed.includes(plan)) { res.status(400).json({ error: "Plan invalide" }); return; }

  await db.update(users)
    .set({ plan, trialEndsAt: null })
    .where(eq(users.id, targetId));

  res.json({ ok: true });
});

// GET /payments/config — returns payment details (IBAN, holder, etc.) for display
router.get("/config", (_req, res) => {
  res.json({
    iban: process.env.PAYMENT_IBAN || "",
    holder: process.env.PAYMENT_HOLDER || "Grado",
    phone: process.env.PAYMENT_PHONE || "",
    bank: process.env.PAYMENT_BANK || "",
  });
});

export default router;
