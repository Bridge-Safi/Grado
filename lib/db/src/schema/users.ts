import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

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
  // Vérification email
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationCode: text("verification_code"),
  verificationCodeExpires: timestamp("verification_code_expires"),
  // Parrainage
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  referralCount: integer("referral_count").notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
