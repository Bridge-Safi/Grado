import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";

export const sharedConversations = pgTable("shared_conversations", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SharedConversation = typeof sharedConversations.$inferSelect;
