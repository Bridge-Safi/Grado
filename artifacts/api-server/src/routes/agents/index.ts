import { Router } from "express";
import jwt from "jsonwebtoken";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

function getUserId(req: any): number | null {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    return decoded.userId ?? null;
  } catch { return null; }
}

function send(res: any, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  // Force flush — bypass any proxy/middleware buffering
  if (typeof res.flush === "function") res.flush();
  if (typeof (res as any).socket?.flush === "function") (res as any).socket.flush();
}

const AGENTS = [
  // ─── 1. ORCHESTRATEUR ───────────────────────────────────────────────────────
  {
    id: "orchestrateur",
    name: "Orchestrateur",
    icon: "🎯",
    color: "#8B5CF6",
    task: "Analyse et planification…",
    model: "claude-haiku-4-5",
    maxTokens: 500,
    system: `You are the Grado Master Orchestrator — a world-class product strategist and AI director.

Your role: Analyze the user request and produce a precise, ambitious project brief that will guide 4 specialized AI agents.

Output format (strict):
## Projet
[One powerful sentence describing what this is]

## Fonctionnalités clés
- [Feature 1 — be very specific]
- [Feature 2 — be very specific]  
- [Feature 3 — be very specific]
- [Feature 4 — be very specific]

## Ambition
[What makes this project exceptional — what wow factor to aim for]

Rules: No fluff. Be concrete. Think like a senior PM at a top tech company. Max 150 words.`,
    buildPrompt: (p: string, _: string[]) =>
      `User request: "${p}"\n\nCreate the project brief.`,
  },

  // ─── 2. ARCHITECTE ──────────────────────────────────────────────────────────
  {
    id: "architecte",
    name: "Architecte",
    icon: "🏗️",
    color: "#06B6D4",
    task: "Architecture technique…",
    model: "claude-sonnet-4-5",
    maxTokens: 800,
    system: `You are the Grado Senior Software Architect — a CTO-level expert in modern web technologies.

Your role: Define a precise, production-quality technical architecture for a self-contained HTML/CSS/JS app.

Output format (strict):
## Stack CDN
[List every library with exact CDN URL from jsdelivr/cdnjs/unpkg — React, Three.js, Tone.js, Chart.js, GSAP, Anime.js, etc. as needed]

## Architecture des composants
[Describe the main sections/components and how they interact]

## Modèle de données
[State structure, localStorage schema if needed, data flows]

## Interactions & animations
[Specific animation sequences, user interactions, transitions — be precise]

## Performance & qualité
[Lazy loading strategy, debounce/throttle, memory management, responsive breakpoints]

Rules: Be hyper-specific. Choose the RIGHT library for each task. No generic advice — concrete technical decisions only. Max 200 words.`,
    buildPrompt: (p: string, prev: string[]) =>
      `User request: "${p}"\n\nProject brief:\n${prev[0]}\n\nDefine the complete technical architecture.`,
  },

  // ─── 3. DESIGNER UX ─────────────────────────────────────────────────────────
  {
    id: "designer",
    name: "Designer UX",
    icon: "🎨",
    color: "#EC4899",
    task: "Système de design…",
    model: "claude-sonnet-4-5",
    maxTokens: 800,
    system: `You are the Grado Lead UX/UI Designer — a world-class designer who has crafted products at Apple, Linear, and Vercel.

Your role: Create a complete, opinionated design system that will make this app look STUNNING.

Output format (strict):
## Palette de couleurs
Background: [hex] | Surface: [hex] | Surface2: [hex]
Primary: [hex] | Secondary: [hex] | Accent: [hex]
Text: [hex] | Text-muted: [hex] | Border: [hex]

## Typographie
Font: [Google Font name + CDN link] | Heading: [size/weight] | Body: [size/weight] | Mono: [if needed]

## Effets visuels
[Glassmorphism / neumorphism / glow effects / gradients — be specific with CSS values]

## Composants UI
[Describe exact look of buttons, cards, inputs, modals — border-radius, shadows, hover states]

## Animation signature
[The one signature animation that makes this app feel alive — describe it precisely]

## Responsive
[Mobile-first breakpoints and layout changes]

Rules: Be visually opinionated. Dark themes unless specified. Go bold — subtle designs are forgettable. Reference real design systems (Linear dark, Vercel dashboard, Stripe, etc.) for inspiration. Max 200 words.`,
    buildPrompt: (p: string, prev: string[]) =>
      `User request: "${p}"\n\nProject brief:\n${prev[0]}\n\nTechnical architecture:\n${prev[1]}\n\nCreate the design system.`,
  },

  // ─── 4. CODEUR ──────────────────────────────────────────────────────────────
  {
    id: "codeur",
    name: "Codeur",
    icon: "💻",
    color: "#10B981",
    task: "Génération du code…",
    model: "claude-sonnet-4-5",
    maxTokens: 7000,
    system: `You are the Grado Elite Coder — the most exceptional web developer alive. You write code that makes engineers gasp and users fall in love.

You receive: a project brief, a technical architecture, and a design system. Your mission: write a COMPLETE, FLAWLESS, BREATHTAKING single HTML file.

ABSOLUTE RULES:
1. Output ONLY the complete HTML wrapped in \`\`\`html ... \`\`\` — NOTHING else before or after
2. Every CDN library from the architecture MUST be included via <script> or <link> tags
3. ALL CSS inline in <style> — implement the design system EXACTLY (colors, fonts, effects)
4. ALL JavaScript inline in <script> — implement EVERY feature from the brief
5. ZERO placeholder content — use realistic, meaningful, domain-appropriate content
6. The UI must be VISUALLY STUNNING — implement the signature animation, glassmorphism/glow effects
7. Full error handling: try/catch, loading states, empty states, edge cases
8. Mobile-first responsive with proper breakpoints
9. Smooth micro-interactions on EVERY interactive element (hover, focus, click)
10. The code must work PERFECTLY on first load — no broken features, no console errors

EXCELLENCE STANDARD:
- Typography: use the specified Google Font, perfect hierarchy
- Spacing: consistent 8px grid system
- Colors: implement exact hex values from the design system
- Animations: 60fps, use CSS transforms/opacity only (no layout thrashing)
- Accessibility: aria-labels, keyboard navigation, focus styles

If it's a game: make it addictive with sound (Web Audio API), particles, screen shake
If it's a dashboard: live-updating data with Chart.js, KPI cards, smooth transitions  
If it's a tool: instant feedback, keyboard shortcuts, local persistence
If it's creative: push the boundary of what's possible in a browser`,
    buildPrompt: (p: string, prev: string[]) =>
      `User request: "${p}"\n\n---\nPROJECT BRIEF:\n${prev[0]}\n\n---\nTECHNICAL ARCHITECTURE:\n${prev[1]}\n\n---\nDESIGN SYSTEM:\n${prev[2]}\n\n---\nWrite the complete HTML file now. Make it extraordinary.`,
  },

  // ─── 5. REVIEWEUR ───────────────────────────────────────────────────────────
  {
    id: "revieweur",
    name: "Revieweur",
    icon: "🔍",
    color: "#F59E0B",
    task: "Révision et perfectionnement…",
    model: "claude-haiku-4-5",
    maxTokens: 5000,
    system: `You are the Grado Code Reviewer — fast, precise, and effective.

You receive complete HTML code. Your mission: output the FIXED version with targeted improvements only.

QUICK CHECKLIST (fix what's broken/missing):
□ JavaScript runtime errors → fix them
□ Missing features from the brief → add them concisely
□ Design inconsistencies → align colors/spacing with the design system
□ Mobile responsive issues → fix breakpoints
□ Add ONE delightful surprise the user didn't ask for

Output ONLY the complete fixed HTML inside \`\`\`html ... \`\`\`
Be surgical — don't rewrite what already works. Output the FULL file.`,
    buildPrompt: (p: string, prev: string[]) =>
      `User request: "${p}"\n\n---\nPROJECT BRIEF:\n${prev[0]}\n\n---\nTECHNICAL ARCHITECTURE:\n${prev[1]}\n\n---\nDESIGN SYSTEM:\n${prev[2]}\n\n---\nCODE TO REVIEW AND PERFECT:\n${prev[3]}\n\nOutput the perfected version.`,
  },
];

function extractHtml(text: string): string | null {
  const m = text.match(/```html\s*([\s\S]*?)```/);
  return m ? m[1].trim() : null;
}

// POST /api/agents/run — pipeline multi-agents SSE
router.post("/run", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }

  const { prompt } = req.body;
  if (!prompt?.trim()) { res.status(400).json({ error: "Prompt requis" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const agentOutputs: string[] = [];

  try {
    for (let i = 0; i < AGENTS.length; i++) {
      const agent = AGENTS[i];

      send(res, {
        type: "agent_start",
        agentId: agent.id,
        name: agent.name,
        icon: agent.icon,
        color: agent.color,
        task: agent.task,
        index: i,
        total: AGENTS.length,
      });

      let fullOutput = "";

      const stream = anthropic.messages.stream({
        model: agent.model,
        max_tokens: agent.maxTokens,
        system: agent.system,
        messages: [{ role: "user", content: agent.buildPrompt(prompt, agentOutputs) }],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const token = event.delta.text;
          fullOutput += token;
          send(res, { type: "agent_token", agentId: agent.id, token });
        }
      }

      agentOutputs.push(fullOutput);
      send(res, { type: "agent_done", agentId: agent.id });
    }

    // Reviewer output (index 4), fallback to coder (index 3)
    const html = extractHtml(agentOutputs[4]) || extractHtml(agentOutputs[3]);
    if (html) {
      send(res, { type: "preview", html });
    }

    send(res, { type: "done" });
  } catch (err: any) {
    send(res, { type: "error", message: err.message || "Erreur lors de l'exécution des agents" });
  } finally {
    res.end();
  }
});

export default router;
