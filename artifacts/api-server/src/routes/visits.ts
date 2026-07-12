import { Router } from "express";
import { db, pageVisits } from "@workspace/db";

const router = Router();

// POST /visits — enregistre une visite (public, pas d'auth requise)
router.post("/", async (req, res) => {
  try {
    const page = typeof req.body?.page === "string" ? req.body.page : "/";
    await db.insert(pageVisits).values({ page });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erreur" });
  }
});

export default router;
