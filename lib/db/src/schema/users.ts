import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("gratuit"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  githubAccessToken: text("github_access_token"),
  githubUsername: text("github_username"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
