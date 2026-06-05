import { Router } from "express";
import { eq } from "drizzle-orm";
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

const SYSTEM_PROMPT = `You are Grado Agent — a powerful AI coding assistant that builds real applications for users. You are similar to Replit Agent but even more capable.

When a user asks you to build something, you:
1. Immediately start planning and describing what you are building
2. Provide detailed technical steps with code snippets
3. Show the structure of the files you would create
4. Give real, working code examples (HTML, CSS, JavaScript, Python, etc.)
5. Think step by step through the implementation

You are energetic, confident, and direct. You always make progress and never say you "can't" build something — you find a way. Your responses are structured, with code blocks for any code you write.

Format your responses with markdown — use headings, bullet points, and code blocks to make your output clear and readable.`;

// GET /anthropic/conversations
router.get("/conversations", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(conversations)
      .orderBy(conversations.createdAt);
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
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [conv] = await db
      .insert(conversations)
      .values({ title: parsed.data.title })
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
      .where(eq(conversations.id, parsed.data.id));
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

    const chatMessages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let fullResponse = "";

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
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
