import { pgTable, serial, timestamp, text } from "drizzle-orm/pg-core";

export const pageVisits = pgTable("page_visits", {
  id: serial("id").primaryKey(),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
  // optionnel : distinguer les pages ou les sources
  page: text("page").default("/").notNull(),
});
