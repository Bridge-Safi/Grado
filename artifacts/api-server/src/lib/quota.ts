import { db, conversations, messages } from "@workspace/db";
import { and, eq, gte, inArray } from "drizzle-orm";

// Créations autorisées par mois selon le plan (null = illimité)
export const PLAN_LIMITS: Record<string, number | null> = {
  gratuit: 5,
  essentiel: 30,
  createur: 150,
  fusion: 500,
  elite: null,
};

// Poids d'une création selon son type — une vidéo coûte 3 créations, tout le reste 1.
export function creationWeight(content: string | null | undefined): number {
  const text = content ?? "";
  if (/\[GRADO_VIDEO/i.test(text)) return 3;
  if (/```|\[GRADO_(MUSIC|IMAGE)/i.test(text)) return 1;
  return 0;
}

export type QuotaStatus = {
  plan: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  reached: boolean;
};

// Calcule l'usage pondéré du mois en cours pour un utilisateur (vidéo = 3, reste = 1).
export async function getMonthlyQuotaStatus(userId: number, plan: string): Promise<QuotaStatus> {
  const limit = PLAN_LIMITS[plan] ?? null;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const userConvs = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.userId, userId));
  const convIds = userConvs.map((c: { id: number }) => c.id);

  let used = 0;
  if (convIds.length) {
    const rows = await db
      .select({ content: messages.content })
      .from(messages)
      .where(and(
        eq(messages.role, "assistant"),
        gte(messages.createdAt, monthStart),
        inArray(messages.conversationId, convIds),
      ));
    used = rows.reduce((sum: number, r: { content: string | null }) => sum + creationWeight(r.content), 0);
  }

  const remaining = limit === null ? null : Math.max(0, limit - used);
  const reached = limit !== null && used >= limit;
  return { plan, used, limit, remaining, reached };
}
