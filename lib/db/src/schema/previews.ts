import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";

export const previews = pgTable("previews", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  htmlContent: text("html_content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Preview = typeof previews.$inferSelect;
