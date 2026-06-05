import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const mediaGenerations = pgTable("media_generations", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  type: text("type").notNull(), // 'music' | 'video'
  prompt: text("prompt").notNull(),
  filePath: text("file_path"),
  status: text("status").notNull().default("pending"), // 'pending' | 'done' | 'error'
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type MediaGeneration = typeof mediaGenerations.$inferSelect;
