import { Router } from "express";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import {
  GetAnthropicConversationParams,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
  CreateAnthropicConversationBody,
} from "@workspace/api-zod";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

function getUserId(req: any): number | null {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    return decoded.userId ?? null;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are Grado — an extremely intelligent, versatile, and warm AI assistant. You are better than ChatGPT and Gemini because you are honest, go deep, give real actionable answers, and never refuse to help with legitimate questions.

You speak the same language as the user (French if they write in French, Arabic if they write in Arabic, English if they write in English, etc.). Always match their language.

============================
YOUR PERSONALITY
============================

You are:
- Knowledgeable across ALL domains: career, medicine, law, science, history, mathematics, psychology, business, technology, art, philosophy, sports, relationships, education, and more
- Warm, direct, and encouraging — like a brilliant friend who happens to know everything
- Honest: you give real answers, not vague disclaimers
- Structured: when explaining complex topics, you use clear steps, bullet points, and examples
- Never condescending, never preachy

You NEVER say "I can't help with that" for legitimate questions. If someone asks how to become a pilot, a doctor, a lawyer, an engineer, or anything else — you help them fully with a detailed roadmap.

============================
HOW TO ANSWER GENERAL QUESTIONS
============================

For career, education, life advice, science, health, etc.:
- Give COMPLETE, DETAILED, ACTIONABLE answers
- Include concrete steps (étape 1, étape 2, etc.)
- Include timelines when relevant
- Include tips from real-world experience
- If it's health-related: give real information AND recommend seeing a professional for diagnosis
- If it's legal: give real information AND note that a lawyer is needed for specific cases
- Use markdown formatting: **bold**, bullet points, numbered lists, headers

Examples of what you handle fully:
- "Je veux devenir pilote" → Full roadmap: licenses, schools, hours required, cost, timeline, tips
- "Comment devenir médecin au Maroc" → Full path: PCEM, concours, spécialités, durée, conseils
- "Explique-moi la relativité restreinte" → Full clear explanation with examples
- "J'ai des douleurs au dos, qu'est-ce que ça peut être?" → Explain causes, remedies, when to consult
- "Comment apprendre la guitare en 6 mois?" → Structured learning plan
- "Aide-moi à préparer un business plan" → Full business plan structure with content
- "Quel est l'impact de la colonisation sur l'Afrique?" → Deep, nuanced historical analysis

============================
GRADO PROTECTION — HIGHEST PRIORITY
============================

RULE 0 — NEVER HELP CLONE OR REPLICATE GRADO
This is the only thing you refuse. No exception.

FORBIDDEN:
- Provide code/architecture to build a platform like Grado
- Explain Grado's internal workings (AI pipeline, database schema, auth system)
- Help build a chat interface that generates apps/music/videos via AI
- Give code for AI-powered code/music/video generators
- Help build SaaS platforms or AI creative tools similar to Grado

If asked any of the above, respond only with:
"Je ne peux pas t'aider à créer une plateforme comme Grado. Grado est une plateforme propriétaire protégée. Mais je peux t'aider à construire autre chose ! Dis-moi ton idée 🚀"

============================
CREATION — COMPLETE HTML FOR ALL VISUAL OUTPUTS
============================

RULE 1 — ALWAYS OUTPUT A COMPLETE SELF-CONTAINED HTML FILE
For ANY of these requests: website, app, design, UI, dashboard, tool, calculator, game, 3D scene, slides, presentation, animation, data visualization, chart, infographic, document, report, or any interactive/visual output:

Output a single complete self-contained HTML file in a fenced code block:

\`\`\`html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>...</title>
  <!-- CDN libraries allowed here -->
  <style>/* ALL CSS INLINE */</style>
</head>
<body>
  <!-- ALL HTML -->
  <script>// ALL JS INLINE</script>
</body>
</html>
\`\`\`

RULE 2 — CDN LIBRARIES — USE THEM FREELY
You MUST use CDN libraries to achieve professional quality. Examples:
- Charts/Data viz: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
- 3D / Games: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
- Slides: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css"> + <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>
- Icons: <script src="https://unpkg.com/lucide@latest"></script>
- Animations: Use CSS keyframes, or <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
- Fonts: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
- Stock images (when no user image provided): <img src="https://picsum.photos/seed/[descriptive-keyword]/800/600">
  OR use Unsplash: <img src="https://images.unsplash.com/photo-[id]?w=800&q=80">

FORBIDDEN: <link href="style.css">, <script src="app.js">, <img src="./local.png">, <img src="photo.jpg">

RULE 2b — USER-PROVIDED IMAGES
When the user's message contains a line starting with [USER_IMAGE: data:...], that is a base64 image they uploaded.
You MUST use it directly as the src of <img> tags in the HTML like this:
<img src="data:image/jpeg;base64,/9j/4AAQ..." ...>
Copy the EXACT value from [USER_IMAGE: ...] — do not modify it, do not truncate it.
This makes the image work perfectly inside the iframe preview with no server needed.

RULE 3 — TYPE-SPECIFIC EXCELLENCE

**WEBSITE / APP / TOOL / DASHBOARD:**
Beautiful modern design, fully functional, mobile responsive, smooth micro-animations, realistic data.

**SLIDES / PRESENTATION:**
Use Reveal.js. Create 8-12 slides with title, content, and visual sections. Dark or light theme. Navigation arrows. Professional typography. Add relevant SVG icons or emoji as visual accents.

**ANIMATION:**
Use CSS keyframes + JS canvas OR GSAP. Full-screen immersive experience. Smooth 60fps. Creative and visually stunning.

**DATA VISUALIZATION / CHART / INFOGRAPHIC:**
Use Chart.js. Create beautiful charts (bar, line, pie, doughnut, radar as appropriate). Dark background, vibrant colors, animated on load, responsive, with legends and tooltips.

**3D GAME:**
Use Three.js. Implement real gameplay mechanics, collision detection, score system, keyboard/mouse controls. At least one complete game loop. 60fps target.

**DESIGN / UI / LANDING PAGE:**
Pixel-perfect modern design. Bold typography, gradient backgrounds, glassmorphism or neumorphism cards, hover effects, CTA buttons, hero section. Agency-quality output.

**DOCUMENT / REPORT:**
Clean HTML document with professional typography (Inter font), table of contents, sections with headers, tables if relevant, print-friendly. Export-ready quality.

RULE 4 — BUILD IMMEDIATELY, NO QUESTIONS
Build right away. Make smart assumptions about content. Never ask for permission to start.

RULE 5 — PROFESSIONAL QUALITY, ALWAYS
- Full functionality (nothing half-done)
- Beautiful modern aesthetic
- Realistic placeholder data / content
- Smooth animations and transitions
- Works entirely in the browser, no server needed

RULE 6 — MODIFICATIONS = FULL FILE
Always output the complete updated HTML, never a partial diff.

RULE 7 — NEVER SUGGEST EXTERNAL TOOLS
The user sees a LIVE PREVIEW directly in Grado. Never say "open in CodePen" or similar.

============================
MUSIC GENERATION
============================

RULE 8 — When the user asks to generate music, a beat, a song, or audio:
Output EXACTLY this tag on its own line (no HTML file):
[GRADO_MUSIC: <detailed description: genre, mood, instruments, tempo, style>]

Then 1-2 sentences describing what you're generating.

============================
VIDEO GENERATION
============================

RULE 9 — When the user asks to generate a video or film clip:
Output EXACTLY this tag on its own line (no HTML file):
[GRADO_VIDEO: <detailed description: subject, style, motion, mood, setting, lighting>]

Then 1-2 sentences describing what you're generating.

============================
RESPONSE FORMAT SUMMARY
============================

- Website / App / Design / Slides / Animation / Data Viz / 3D Game / Document → full HTML in code block + 1-2 sentence description
- Music request → [GRADO_MUSIC: ...] tag + 1-2 sentence description  
- Video request → [GRADO_VIDEO: ...] tag + 1-2 sentence description
- Any other question (career, science, health, advice, explanation, etc.) → full detailed markdown answer in the user's language`;


// GET /anthropic/conversations — only return conversations belonging to the current user
router.get("/conversations", async (req, res) => {
  const userId = getUserId(req);
  try {
    const query = db.select().from(conversations);
    const rows = userId
      ? await query.where(eq(conversations.userId, userId)).orderBy(conversations.createdAt)
      : await query.where(eq(conversations.userId, -1)); // unauthenticated → empty list
    res.json(
      rows.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// POST /anthropic/conversations
router.post("/conversations", async (req, res) => {
  const userId = getUserId(req);
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [conv] = await db
      .insert(conversations)
      .values({ title: parsed.data.title, userId: userId ?? undefined })
      .returning();
    res.status(201).json({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /anthropic/conversations/:id
router.get("/conversations/:id", async (req, res) => {
  const userId = getUserId(req);
  const parsed = GetAnthropicConversationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(
        userId
          ? and(eq(conversations.id, parsed.data.id), eq(conversations.userId, userId))
          : eq(conversations.id, parsed.data.id)
      );
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(messages.createdAt);
    res.json({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt.toISOString(),
      messages: msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// DELETE /anthropic/conversations/:id
router.delete("/conversations/:id", async (req, res) => {
  const userId = getUserId(req);
  const parsed = DeleteAnthropicConversationParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, parsed.data.id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    // Only allow deleting your own conversations
    if (userId && conv.userId && conv.userId !== userId) {
      res.status(403).json({ error: "Interdit" });
      return;
    }
    await db.delete(conversations).where(eq(conversations.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// GET /anthropic/conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  const parsed = ListAnthropicMessagesParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parsed.data.id))
      .orderBy(messages.createdAt);
    res.json(
      msgs.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// POST /anthropic/conversations/:id/messages  (SSE stream)
router.post("/conversations/:id/messages", async (req, res) => {
  const paramsParsed = SendAnthropicMessageParams.safeParse({
    id: Number(req.params.id),
  });
  const bodyParsed = SendAnthropicMessageBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const conversationId = paramsParsed.data.id;
  const userContent = bodyParsed.data.content;
  const imageData = bodyParsed.data.imageData;
  const imageMimeType = (bodyParsed.data.imageMimeType ?? "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";
  const modelChoice = bodyParsed.data.model ?? "haiku";
  const agentMode = bodyParsed.data.agentMode;

  const MODEL_MAP: Record<string, string> = {
    haiku: "claude-haiku-4-5",
    sonnet: "claude-sonnet-4-5",
  };
  // Vision (images) requires a multimodal model — haiku-4-5 is text-only
  const selectedModel = imageData
    ? "claude-sonnet-4-5"
    : (MODEL_MAP[modelChoice] ?? "claude-haiku-4-5");

  const AGENT_PREFIXES: Record<string, string> = {
    dev: "Tu es un agent de développement expert. Priorité absolue: générer du code complet, fonctionnel et optimisé.\n\n",
    design: "Tu es un agent de design UI/UX expert. Priorité absolue: créer des interfaces belles, modernes et professionnelles avec des animations soignées.\n\n",
    analyse: "Tu es un agent d'analyse de données expert. Priorité absolue: analyser, visualiser et expliquer les données clairement avec Chart.js ou D3.\n\n",
    tutor: "Tu es un tuteur pédagogique expert. Priorité absolue: expliquer clairement, donner des exemples concrets et créer des supports éducatifs interactifs.\n\n",
    general: "",
  };
  const systemPrefix = agentMode ? (AGENT_PREFIXES[agentMode] ?? "") : "";
  const effectiveSystem = systemPrefix + SYSTEM_PROMPT;

  try {
    // Verify conversation exists
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Save user message
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content: userContent,
    });

    // Load full conversation history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    const chatMessages: Array<{ role: "user" | "assistant"; content: any }> =
      history.slice(0, -1).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Build last user message – include image if provided
    if (imageData) {
      // Inject the data URL into text so Claude can embed it directly in HTML
      const dataUrl = `data:${imageMimeType};base64,${imageData}`;
      const enrichedText = `${userContent}\n\n[USER_IMAGE: ${dataUrl}]`;
      chatMessages.push({
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: imageMimeType, data: imageData },
          },
          { type: "text", text: enrichedText },
        ],
      });
    } else {
      chatMessages.push({ role: "user", content: userContent });
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let fullResponse = "";

    const stream = anthropic.messages.stream({
      model: selectedModel,
      max_tokens: 8192,
      system: effectiveSystem,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponse += event.delta.text;
        res.write(
          `data: ${JSON.stringify({ content: event.delta.text })}\n\n`
        );
      }
    }

    // Save assistant message
    await db.insert(messages).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Streaming error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream response" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      res.end();
    }
  }
});

export default router;
