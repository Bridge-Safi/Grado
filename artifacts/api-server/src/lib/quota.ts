import { db, conversations, messages } from "@workspace/db";
import { and, eq, gte, inArray } from "drizzle-orm";

// Créations autorisées par mois selon le plan (null = illimité)
// Fusion abaissé de 500 à 300 : à 500, un client qui consomme tout son quota en
// génération de sites (≈0,05€/création via Claude) coûtait jusqu'à 25€, au-dessus
// du prix du plan (17€). Voir aussi VIDEO_MONTHLY_CAP ci-dessous pour la vidéo,
// dont le coût réel (0,10€ à plusieurs € selon le modèle fal.ai) est très variable.
// Élite plafonné à 600 (et non "illimité") pour éviter un coût incontrôlable :
// 600 créations × 0,05€ + 30 vidéos × 0,30€ = 39€ de coût max → prix 59€ → marge 34%.
export const PLAN_LIMITS: Record<string, number | null> = {
  gratuit: 5,
  essentiel: 30,
  createur: 150,
  fusion: 300,
  elite: 600,
};

// Plafond mensuel de vidéos, indépendant du quota de créations global. La vidéo est
// le poste de coût le plus risqué (modèles fal.ai de 0,10€ à 0,50€+ par génération) —
// un plafond dédié évite qu'un seul client ne consomme un budget disproportionné,
// même sur le plan "illimité" Élite.
export const VIDEO_MONTHLY_CAP: Record<string, number> = {
  fusion: 15,
  elite: 30,
};

// Poids d'une création selon son type — une vidéo coûte 8 créations (coût réel
// nettement supérieur à un site ou une image), tout le reste 1.
export function creationWeight(content: string | null | undefined): number {
  const text = content ?? "";
  if (/\[GRADO_VIDEO/i.test(text)) return 8;
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

// Plans dont le quota se remet à zéro chaque JOUR (minuit) plutôt que chaque mois.
// Le plan gratuit est quotidien : 5 créations/jour — les plans payants restent mensuels.
const DAILY_PLANS = new Set(["gratuit"]);

// Calcule l'usage pondéré de la période en cours pour un utilisateur.
// - Plans gratuits : fenêtre = aujourd'hui 00h00 (quota journalier)
// - Plans payants  : fenêtre = 1er du mois en cours (quota mensuel)
export async function getMonthlyQuotaStatus(userId: number, plan: string): Promise<QuotaStatus> {
  const limit = PLAN_LIMITS[plan] ?? null;

  const periodStart = new Date();
  if (DAILY_PLANS.has(plan)) {
    // Quota journalier : repart à minuit chaque jour
    periodStart.setHours(0, 0, 0, 0);
  } else {
    // Quota mensuel : repart le 1er du mois
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
  }

  const userConvs = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.userId, userId));
  const convIds = userConvs.map((c: { id: number }) => c.id);

  let used = 0;
  if (convIds.length) {
    const rows = await db
      .select({ content: messages.content })
      .from(messages)
      .where(and(
        eq(messages.role, "assistant"),
        gte(messages.createdAt, periodStart),
        inArray(messages.conversationId, convIds),
      ));
    used = rows.reduce((sum: number, r: { content: string | null }) => sum + creationWeight(r.content), 0);
  }

  const remaining = limit === null ? null : Math.max(0, limit - used);
  const reached = limit !== null && used >= limit;
  return { plan, used, limit, remaining, reached };
}
