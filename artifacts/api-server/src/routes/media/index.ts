import { Router } from "express";
import { db, mediaGenerations, conversations, users } from "@workspace/db";
import { and, eq, gte, inArray } from "drizzle-orm";
import fs from "fs";
import path from "path";

const router = Router();

const WORKSPACE_ROOT = process.cwd().replace(/\/artifacts\/api-server.*/, "");

function resolveMediaPath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(WORKSPACE_ROOT, filePath);
}

// POST /media/music — generate music
// Primary: fal.ai ACE-Step (full songs with vocals + lyrics, ~3 min)
// Fallback: ElevenLabs sound-generation (instrumental, 20s)
router.post("/music", async (req, res) => {
  const { conversationId, prompt, lyrics, genre, durationSeconds = 180 } = req.body;
  if (!conversationId || !prompt) {
    res.status(400).json({ error: "conversationId and prompt required" });
    return;
  }

  const falKey = process.env.FAL_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;

  if (!falKey && !elevenKey) {
    res.status(503).json({ error: "No music API configured" });
    return;
  }

  // Musique réservée aux plans payants — fal.ai ACE-Step coûte de l'argent
  // même pour de courtes générations ; offrir de la musique gratuite n'est pas viable.
  try {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, Number(conversationId)));
    if (conv?.userId) {
      const [u] = await db.select({ plan: users.plan, email: users.email }).from(users).where(eq(users.id, conv.userId));
      const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
      const isAdmin = !!(adminEmail && u?.email && u.email.toLowerCase().trim() === adminEmail);
      if (u?.plan === "gratuit" && !isAdmin) {
        res.status(403).json({ error: "FREE_MUSIC_QUOTA_REACHED" });
        return;
      }
    }
  } catch (quotaErr) {
    console.error("music quota check error:", quotaErr);
  }

  const [record] = await db
    .insert(mediaGenerations)
    .values({ conversationId: Number(conversationId), type: "music", prompt, status: "pending" })
    .returning();

  res.status(202).json({ id: record.id, status: "pending" });

  const dir = path.join(WORKSPACE_ROOT, "attached_assets", "generated_audio");
  fs.mkdirSync(dir, { recursive: true });

  // ── fal.ai ACE-Step: full song with vocals ─────────────────────────────────
  if (falKey) {
    (async () => {
      try {
        const tags = [genre || "", prompt].filter(Boolean).join(", ");
        // Free users: max 60s (preview quality). Paid users: max 4 min (studio).
        const maxDuration = u?.plan && u.plan !== "gratuit" ? 240 : 60;
        const audioDuration = Math.min(Number(durationSeconds), maxDuration);

        const submitRes = await fetch("https://queue.fal.run/fal-ai/ace-step", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tags,
            lyrics: lyrics || "[verse]\n" + prompt + "\n[chorus]\n" + prompt,
            audio_duration: audioDuration,
          }),
        });

        if (!submitRes.ok) {
          const err = await submitRes.text();
          throw new Error(`FAL submit error ${submitRes.status}: ${err}`);
        }

        const { request_id } = await submitRes.json() as { request_id: string };

        // Poll for completion (up to 8 minutes)
        let audioUrl: string | null = null;
        for (let i = 0; i < 96; i++) {
          await new Promise(r => setTimeout(r, 5000));
          const statusRes = await fetch(
            `https://queue.fal.run/fal-ai/ace-step/requests/${request_id}`,
            { headers: { "Authorization": `Key ${falKey}` } }
          );
          if (!statusRes.ok) continue;
          const data = await statusRes.json() as any;
          if (data.status === "COMPLETED" && data.output?.audio?.url) {
            audioUrl = data.output.audio.url;
            break;
          }
          if (data.status === "FAILED") throw new Error("ACE-Step generation failed: " + JSON.stringify(data.error));
        }

        if (!audioUrl) throw new Error("Music generation timed out");

        const audioRes = await fetch(audioUrl);
        const audioBuffer = await audioRes.arrayBuffer();
        const fileName = `music_${record.id}_${Date.now()}.mp3`;
        fs.writeFileSync(path.join(dir, fileName), Buffer.from(audioBuffer));

        await db
          .update(mediaGenerations)
          .set({ status: "done", filePath: `attached_assets/generated_audio/${fileName}` })
          .where(eq(mediaGenerations.id, record.id));
      } catch (err: any) {
        console.error("ACE-Step music error:", err.message);
        // If FAL fails, try ElevenLabs fallback
        if (elevenKey) {
          await generateWithElevenLabs(elevenKey, prompt, record.id, dir);
        } else {
          await db
            .update(mediaGenerations)
            .set({ status: "error", error: err.message })
            .where(eq(mediaGenerations.id, record.id));
        }
      }
    })();
    return;
  }

  // ── ElevenLabs fallback: instrumental only ─────────────────────────────────
  generateWithElevenLabs(elevenKey!, prompt, record.id, dir);
});

async function generateWithElevenLabs(apiKey: string, prompt: string, recordId: number, dir: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({ text: prompt, duration_seconds: 20, prompt_influence: 0.8 }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs error ${response.status}: ${err}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const fileName = `music_${recordId}_${Date.now()}.mp3`;
    fs.writeFileSync(path.join(dir, fileName), Buffer.from(audioBuffer));

    await db
      .update(mediaGenerations)
      .set({ status: "done", filePath: `attached_assets/generated_audio/${fileName}` })
      .where(eq(mediaGenerations.id, recordId));
  } catch (err: any) {
    console.error("ElevenLabs fallback error:", err.message);
    await db
      .update(mediaGenerations)
      .set({ status: "error", error: err.message })
      .where(eq(mediaGenerations.id, recordId));
  }
}

// POST /media/video — generate video via FAL.ai
router.post("/video", async (req, res) => {
  const { conversationId, prompt, aspectRatio = "16:9" } = req.body;
  if (!conversationId || !prompt) {
    res.status(400).json({ error: "conversationId and prompt required" });
    return;
  }

  // La vidéo n'est jamais gratuite : plan gratuit bloqué d'office, et chaque vidéo
  // coûte 8 créations sur le quota mensuel des plans payants (voir lib/quota.ts) —
  // en plus, un plafond mensuel dédié (VIDEO_MONTHLY_CAP) s'applique car le coût réel
  // d'une vidéo varie fortement (0,10€ à plusieurs € selon le modèle fal.ai utilisé),
  // même pour le plan Élite qui n'a pas de plafond sur le reste.
  // Ce contrôle passe AVANT la vérification de FAL_KEY pour que l'utilisateur voie
  // toujours le bon message (upgrade de plan) plutôt qu'une erreur de config serveur.
  const VIDEO_COST = 8;
  try {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, Number(conversationId)));
    if (conv?.userId) {
      const [u] = await db.select({ plan: users.plan, email: users.email }).from(users).where(eq(users.id, conv.userId));
      const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
      const isAdmin = !!(adminEmail && u?.email && u.email.toLowerCase().trim() === adminEmail);
      if (!isAdmin) {
        if (u?.plan === "gratuit") {
          res.status(403).json({ error: "FREE_VIDEO_QUOTA_REACHED" });
          return;
        }
        const { getMonthlyQuotaStatus, VIDEO_MONTHLY_CAP } = await import("../../lib/quota.js");
        const status = await getMonthlyQuotaStatus(conv.userId, u?.plan ?? "gratuit");
        if (status.limit !== null && status.used + VIDEO_COST > status.limit) {
          res.status(403).json({ error: "PLAN_VIDEO_QUOTA_REACHED" });
          return;
        }
        const videoCap = VIDEO_MONTHLY_CAP[u?.plan ?? ""];
        if (videoCap !== undefined) {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const userConvs = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.userId, conv.userId));
          const convIds = userConvs.map((c) => c.id);
          const videosThisMonth = convIds.length
            ? await db
                .select({ id: mediaGenerations.id })
                .from(mediaGenerations)
                .where(and(
                  eq(mediaGenerations.type, "video"),
                  gte(mediaGenerations.createdAt, monthStart),
                  inArray(mediaGenerations.conversationId, convIds),
                ))
            : [];
          if (videosThisMonth.length >= videoCap) {
            res.status(403).json({ error: "PLAN_VIDEO_MONTHLY_CAP_REACHED" });
            return;
          }
        }
      }
    }
  } catch (quotaErr) {
    console.error("video quota check error:", quotaErr);
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

  // Generate asynchronously — tries models in order until one succeeds
  (async () => {
    // Models tried in order: ltx-video (fast, open-source) → cogvideox → wan → minimax (premium)
    type VideoModel = {
      id: string;
      body: Record<string, unknown>;
      getUrl: (output: any) => string | null;
    };
    const MODELS: VideoModel[] = [
      {
        id: "fal-ai/ltx-video",
        body: { prompt, negative_prompt: "blurry, low quality", num_inference_steps: 30 },
        getUrl: (o) => o?.video?.url ?? null,
      },
      {
        id: "fal-ai/cogvideox-5b",
        body: { prompt },
        getUrl: (o) => o?.video?.url ?? null,
      },
      {
        id: "fal-ai/wan/t2v-14b",
        body: { prompt },
        getUrl: (o) => o?.video?.url ?? null,
      },
      {
        id: "fal-ai/minimax-video/v2/video-01",
        body: { prompt, aspect_ratio: aspectRatio, duration: "6s" },
        getUrl: (o) => o?.video?.url ?? null,
      },
    ];

    const headers = { "Authorization": `Key ${apiKey}`, "Content-Type": "application/json" };

    let videoUrl: string | null = null;
    let lastError = "All video models failed";

    for (const model of MODELS) {
      try {
        const submitRes = await fetch(`https://queue.fal.run/${model.id}`, {
          method: "POST",
          headers,
          body: JSON.stringify(model.body),
        });

        if (!submitRes.ok) {
          lastError = `${model.id}: ${submitRes.status} ${await submitRes.text()}`;
          console.warn(`Video model ${model.id} rejected (${submitRes.status}), trying next...`);
          continue;
        }

        const { request_id } = await submitRes.json() as { request_id: string };

        // Poll up to 5 min
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 5000));
          const pollRes = await fetch(`https://queue.fal.run/${model.id}/requests/${request_id}`, { headers });
          if (!pollRes.ok) continue;
          const data = await pollRes.json() as any;
          if (data.status === "COMPLETED") {
            videoUrl = model.getUrl(data.output);
            break;
          }
          if (data.status === "FAILED") throw new Error(`${model.id} generation failed`);
        }

        if (videoUrl) break; // success — stop trying models
        lastError = `${model.id} timed out`;
      } catch (modelErr: any) {
        lastError = modelErr.message;
        console.warn(`Video model ${model.id} error:`, modelErr.message);
      }
    }

    if (!videoUrl) throw new Error(lastError);

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
  })().catch(async (err: any) => {
    console.error("Video generation error:", err.message);
    await db
      .update(mediaGenerations)
      .set({ status: "error", error: err.message })
      .where(eq(mediaGenerations.id, record.id));
  });
});

// POST /media/image — generate image via FAL.ai Flux Schnell (fast, ~3s)
router.post("/image", async (req, res) => {
  const { conversationId, prompt } = req.body;
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
    .values({ conversationId: Number(conversationId), type: "image", prompt, status: "pending" })
    .returning();

  res.status(202).json({ id: record.id, status: "pending" });

  (async () => {
    try {
      const dir = path.join(WORKSPACE_ROOT, "attached_assets", "generated_images");
      fs.mkdirSync(dir, { recursive: true });
      const fileName = `image_${record.id}_${Date.now()}.jpg`;
      const filePath = path.join(dir, fileName);

      // ── Primary: Pollinations.ai — free, no API key, Flux-based ──────────────
      const seed = Math.floor(Math.random() * 999999);
      const encodedPrompt = encodeURIComponent(
        prompt + ", masterpiece, highly detailed, sharp focus, professional photography"
      );
      const pollinationsUrl =
        `https://image.pollinations.ai/prompt/${encodedPrompt}` +
        `?width=1280&height=960&model=flux&nologo=true&enhance=true&seed=${seed}`;

      let imageBuffer: Buffer | null = null;

      try {
        const imgRes = await fetch(pollinationsUrl, {
          headers: { "User-Agent": "Grado/1.0" },
          signal: AbortSignal.timeout(60_000),
        });
        if (imgRes.ok) {
          imageBuffer = Buffer.from(await imgRes.arrayBuffer());
        }
      } catch (e: any) {
        console.warn("Pollinations failed, trying FAL:", e.message);
      }

      // ── Fallback: FAL.ai Flux Schnell (if FAL_KEY set and Pollinations failed)
      if (!imageBuffer && apiKey) {
        const falRes = await fetch("https://fal.run/fal-ai/flux/schnell", {
          method: "POST",
          headers: { "Authorization": `Key ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            image_size: "landscape_4_3",
            num_inference_steps: 4,
            num_images: 1,
            enable_safety_checker: true,
          }),
        });
        if (!falRes.ok) throw new Error(`FAL image error ${falRes.status}: ${await falRes.text()}`);
        const data = await falRes.json() as any;
        const imageUrl: string | undefined = data?.images?.[0]?.url;
        if (!imageUrl) throw new Error("No image URL in FAL response");
        const dlRes = await fetch(imageUrl);
        imageBuffer = Buffer.from(await dlRes.arrayBuffer());
      }

      if (!imageBuffer) throw new Error("Tous les services d'image ont échoué");

      fs.writeFileSync(filePath, imageBuffer);
      await db
        .update(mediaGenerations)
        .set({ status: "done", filePath: `attached_assets/generated_images/${fileName}` })
        .where(eq(mediaGenerations.id, record.id));
    } catch (err: any) {
      console.error("Image generation error:", err.message);
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
  const contentType =
    ext === ".mp4" ? "video/mp4" :
    ext === ".webp" || ext === ".png" || ext === ".jpg" || ext === ".jpeg" ? `image/${ext.slice(1)}` :
    "audio/mpeg";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=3600");
  fs.createReadStream(absPath).pipe(res);
});

export default router;
