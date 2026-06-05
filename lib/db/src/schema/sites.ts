import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull().default("Mon site Grado"),
  htmlContent: text("html_content").notNull(),
  customDomain: text("custom_domain"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
