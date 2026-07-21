import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const siteVersions = pgTable("site_versions", {
  id: serial("id").primaryKey(),
  siteSlug: text("site_slug").notNull().references(() => sites.slug, { onDelete: "cascade" }),
  htmlContent: text("html_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SiteVersion = typeof siteVersions.$inferSelect;
