import { Router } from "express";
import { db, mediaGenerations } from "@workspace/db";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

const router = Router();

const WORKSPACE_ROOT = process.cwd().replace(/\/artifacts\/api-server.*/, "");

function resolveMediaPath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(WORKSPACE_ROOT, filePath);
}

// POST /media/music — generate music via ElevenLabs sound-generation (free plan)
router.post("/music", async (req, res) => {
  const { conversationId, prompt, durationSeconds = 22 } = req.body;
  if (!conversationId || !prompt) {
    res.status(400).json({ error: "conversationId and prompt required" });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "ELEVENLABS_API_KEY not configured" });
    return;
  }

  const [record] = await db
    .insert(mediaGenerations)
    .values({ conversationId: Number(conversationId), type: "music", prompt, status: "pending" })
    .returning();

  res.status(202).json({ id: record.id, status: "pending" });

  // Generate asynchronously using ElevenLabs sound-generation (works on free plan)
  (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000); // 90s max
      const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: Math.min(Number(durationSeconds), 20),
          prompt_influence: 0.8,
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`ElevenLabs error ${response.status}: ${err}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const dir = path.join(WORKSPACE_ROOT, "attached_assets", "generated_audio");
      fs.mkdirSync(dir, { recursive: true });
      const fileName = `music_${record.id}_${Date.now()}.mp3`;
      const filePath = path.join(dir, fileName);
      fs.writeFileSync(filePath, Buffer.from(audioBuffer));

      await db
        .update(mediaGenerations)
        .set({ status: "done", filePath: `attached_assets/generated_audio/${fileName}` })
        .where(eq(mediaGenerations.id, record.id));
    } catch (err: any) {
      console.error("Music generation error:", err.message);
      await db
        .update(mediaGenerations)
        .set({ status: "error", error: err.message })
        .where(eq(mediaGenerations.id, record.id));
    }
  })();
});

// POST /media/video — generate video via FAL.ai
router.post("/video", async (req, res) => {
  const { conversationId, prompt, aspectRatio = "16:9" } = req.body;
  if (!conversationId || !prompt) {
    res.status(400).json({ error: "conversationId and prompt required" });
    return;
  }

  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "FAL_KEY not configured" });
    return;
  }

  const [record] = await db
    .insert(mediaGenerations)
    .values({ conversationId: Number(conversationId), type: "video", prompt, status: "pending" })
    .returning();

  res.status(202).json({ id: record.id, status: "pending" });

  // Generate asynchronously via FAL.ai queue
  (async () => {
    try {
      const submitRes = await fetch("https://queue.fal.run/fal-ai/minimax-video/v2/video-01", {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, aspect_ratio: aspectRatio, duration: "6s" }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.text();
        throw new Error(`FAL submit error ${submitRes.status}: ${err}`);
      }

      const { request_id } = await submitRes.json() as { request_id: string };

      // Poll for completion (up to 5 minutes)
      let videoUrl: string | null = null;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(
          `https://queue.fal.run/fal-ai/minimax-video/v2/video-01/requests/${request_id}`,
          { headers: { "Authorization": `Key ${apiKey}` } }
        );
        if (!statusRes.ok) continue;
        const data = await statusRes.json() as any;
        if (data.status === "COMPLETED" && data.output?.video?.url) {
          videoUrl = data.output.video.url;
          break;
        }
        if (data.status === "FAILED") throw new Error("FAL video generation failed");
      }

      if (!videoUrl) throw new Error("Video generation timed out");

      const videoRes = await fetch(videoUrl);
      const videoBuffer = await videoRes.arrayBuffer();
      const dir = path.join(WORKSPACE_ROOT, "attached_assets", "generated_videos");
      fs.mkdirSync(dir, { recursive: true });
      const fileName = `video_${record.id}_${Date.now()}.mp4`;
      fs.writeFileSync(path.join(dir, fileName), Buffer.from(videoBuffer));

      await db
        .update(mediaGenerations)
        .set({ status: "done", filePath: `attached_assets/generated_videos/${fileName}` })
        .where(eq(mediaGenerations.id, record.id));
    } catch (err: any) {
      console.error("Video generation error:", err.message);
      await db
        .update(mediaGenerations)
        .set({ status: "error", error: err.message })
        .where(eq(mediaGenerations.id, record.id));
    }
  })();
});

// GET /media/:id — poll status
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [record] = await db
    .select()
    .from(mediaGenerations)
    .where(eq(mediaGenerations.id, id));

  if (!record) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: record.id,
    type: record.type,
    status: record.status,
    error: record.error,
    fileUrl: record.filePath ? `/api/media/file/${record.id}` : null,
  });
});

// GET /media/file/:id — stream the media file
router.get("/file/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).send("Invalid id"); return; }

  const [record] = await db
    .select()
    .from(mediaGenerations)
    .where(eq(mediaGenerations.id, id));

  if (!record || !record.filePath) { res.status(404).send("File not found"); return; }

  const absPath = resolveMediaPath(record.filePath);
  if (!fs.existsSync(absPath)) { res.status(404).send("File not found on disk"); return; }

  const ext = path.extname(absPath).toLowerCase();
  const contentType = ext === ".mp4" ? "video/mp4" : "audio/mpeg";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=3600");
  fs.createReadStream(absPath).pipe(res);
});

export default router;
