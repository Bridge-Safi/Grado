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
}

const AGENTS = [
  {
    id: "orchestrateur",
    name: "Orchestrateur",
    icon: "🎯",
    color: "#8B5CF6",
    task: "Analyse de la demande…",
    model: "claude-haiku-4-5",
    system: `You are the Grado AI Orchestrator — the master planner.
Given a user request, write a clear, structured plan of what will be built.
Format your response as exactly 3 bullet points:
• [What the project IS] — describe the core concept
• [Key features] — list 3-4 specific features
• [Technical approach] — which technologies/techniques will be used

Be specific, concrete, and exciting. Max 120 words total. No intro text.`,
    buildPrompt: (userPrompt: string, _prev: string[]) =>
      `User request: "${userPrompt}"\n\nCreate a brief orchestration plan for building this.`,
  },
  {
    id: "architecte",
    name: "Architecte",
    icon: "🏗️",
    color: "#06B6D4",
    task: "Conception de l'architecture…",
    model: "claude-haiku-4-5",
    system: `You are the Grado AI Architect — the technical designer.
Given a user request and orchestration plan, define the technical architecture.
Format your response as:
**Stack:** [CDN libraries to use from jsdelivr/unpkg]
**Structure:** [Main components/sections]
**Data:** [State, localStorage keys if needed]
**Animations:** [Key interactions/animations]
**Special features:** [Anything unique to implement]

Be very specific about library versions and implementation details. Max 150 words.`,
    buildPrompt: (userPrompt: string, prev: string[]) =>
      `User request: "${userPrompt}"\n\nOrchestrator plan:\n${prev[0]}\n\nDefine the technical architecture.`,
  },
  {
    id: "codeur",
    name: "Codeur",
    icon: "💻",
    color: "#10B981",
    task: "Écriture du code…",
    model: "claude-sonnet-4-5",
    system: `You are the Grado AI Coder — the most powerful web developer in the world.
Given a user request, orchestration plan, and architecture spec, write a COMPLETE, PRODUCTION-READY single HTML file.

RULES:
- Output ONLY the complete HTML inside \`\`\`html ... \`\`\` — nothing else
- Use CDN libraries from the architecture spec
- The HTML must be fully self-contained (all CSS + JS inline)
- Build the most impressive, complete, polished version possible
- Dark/modern UI by default unless specified otherwise
- Include ALL features from the plan — nothing missing
- Smooth animations, micro-interactions, professional typography
- Error handling, loading states, mobile responsive
- Never use placeholder text — use realistic, meaningful content
- The result must be visually stunning and fully functional`,
    buildPrompt: (userPrompt: string, prev: string[]) =>
      `User request: "${userPrompt}"\n\nOrchestrator plan:\n${prev[0]}\n\nArchitecture:\n${prev[1]}\n\nWrite the complete HTML file now.`,
  },
  {
    id: "revieweur",
    name: "Revieweur",
    icon: "🔍",
    color: "#F59E0B",
    task: "Révision et optimisation…",
    model: "claude-haiku-4-5",
    system: `You are the Grado AI Reviewer — the quality specialist.
Review the provided code and improve it. Output ONLY the improved complete HTML inside \`\`\`html ... \`\`\`.

Check and fix:
1. All features from the plan are implemented
2. No console errors or broken functionality
3. UI polish: better colors, spacing, typography
4. Missing error states or edge cases
5. Performance: debounce, requestAnimationFrame where needed
6. Accessibility basics (aria labels, keyboard nav)
7. Mobile responsiveness

Make it noticeably better. Output the complete improved HTML.`,
    buildPrompt: (userPrompt: string, prev: string[]) =>
      `User request: "${userPrompt}"\n\nOriginal code to review and improve:\n${prev[2]}\n\nOutput the improved version.`,
  },
];

function extractHtml(text: string): string | null {
  const m = text.match(/```html\s*([\s\S]*?)```/);
  return m ? m[1].trim() : null;
}

// POST /api/agents/run — multi-agent SSE stream
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
      });

      let fullOutput = "";

      const stream = anthropic.messages.stream({
        model: agent.model,
        max_tokens: agent.id === "codeur" ? 8000 : agent.id === "revieweur" ? 8000 : 600,
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
      send(res, { type: "agent_done", agentId: agent.id, summary: fullOutput.slice(0, 200) });
    }

    // Extract final HTML from reviewer (or coder as fallback)
    const html = extractHtml(agentOutputs[3]) || extractHtml(agentOutputs[2]);
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
