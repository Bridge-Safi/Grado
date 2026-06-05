import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { previews } from "@workspace/db";

const router = Router();

// POST /preview — save HTML and return a public URL
router.post("/", async (req, res) => {
  const { conversationId, htmlContent } = req.body;
  if (!conversationId || !htmlContent) {
    res.status(400).json({ error: "conversationId and htmlContent required" });
    return;
  }
  try {
    const [preview] = await db
      .insert(previews)
      .values({ conversationId: Number(conversationId), htmlContent })
      .returning();
    res.status(201).json({
      id: preview.id,
      previewUrl: `/api/preview/${preview.id}`,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to save preview" });
  }
});

// GET /preview/:id — serve the HTML page directly
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).send("Invalid id");
    return;
  }
  try {
    const [preview] = await db
      .select()
      .from(previews)
      .where(eq(previews.id, id));
    if (!preview) {
      res.status(404).send("Preview not found");
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "");
    res.send(preview.htmlContent);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

export default router;
