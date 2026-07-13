// Shared email helpers — all fire-and-forget (never throw to callers)

const API_KEY = () => process.env.RESEND_API_KEY || "";
const FROM    = () => process.env.RESEND_FROM_EMAIL || "noreply@grado.app";

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!API_KEY()) return; // silent no-op when key missing
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM(), to, subject, html }),
    });
  } catch { /* never crash the caller */ }
}

const BASE = `font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#08080f;color:#fff;border-radius:16px;overflow:hidden`;
const LOGO = `<div style="background:#0d0d18;padding:20px 28px;border-bottom:1px solid #1e1e2a">
  <span style="font-size:18px;font-weight:800;color:#5B5BD6;letter-spacing:-0.5px">Grado</span>
  <span style="font-size:11px;color:#555568;margin-left:8px">AI Creator</span>
</div>`;
const FOOTER = `<div style="padding:18px 28px;background:#050508;border-top:1px solid #1e1e2a;font-size:11px;color:#44445a;text-align:center">
  © 2026 Grado · <a href="https://grado.app" style="color:#5B5BD6;text-decoration:none">grado.app</a>
</div>`;

// ── 1. Bienvenue après inscription ─────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const html = `<div style="${BASE}">
    ${LOGO}
    <div style="padding:32px 28px">
      <h1 style="font-size:22px;font-weight:800;margin:0 0 8px">Bienvenue sur Grado, ${name} 👋</h1>
      <p style="color:#8888A8;margin:0 0 24px;font-size:14px;line-height:1.6">
        Ton compte est actif. Tu peux maintenant créer des apps, de la musique et des vidéos IA directement dans le chat.
      </p>

      <div style="background:#0d0d18;border:1px solid #1e1e2a;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#C8C8E8">Ce que tu as sur le plan Gratuit :</p>
        <ul style="margin:0;padding:0 0 0 18px;color:#8888A8;font-size:13px;line-height:2">
          <li>5 créations / mois (apps, sites, jeux…)</li>
          <li>3 chansons IA / mois</li>
          <li>Hébergement d'1 site</li>
        </ul>
      </div>

      <a href="https://grado.app/chat" style="display:inline-block;background:#5B5BD6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">
        Commencer à créer →
      </a>
    </div>
    ${FOOTER}
  </div>`;
  await send(to, "Bienvenue sur Grado 🚀", html);
}

// ── 2. Quota de créations atteint ─────────────────────────────────────────
export async function sendQuotaReachedEmail(to: string, name: string, quotaType: "creations" | "videos" | "music"): Promise<void> {
  const labels: Record<string, { emoji: string; what: string; limit: string }> = {
    creations: { emoji: "⚡", what: "créations",       limit: "5 créations/mois" },
    videos:    { emoji: "🎬", what: "vidéos IA",       limit: "2 vidéos/mois"    },
    music:     { emoji: "🎵", what: "chansons IA",     limit: "3 chansons/mois"  },
  };
  const { emoji, what, limit } = labels[quotaType];

  const html = `<div style="${BASE}">
    ${LOGO}
    <div style="padding:32px 28px">
      <div style="font-size:36px;margin-bottom:12px">${emoji}</div>
      <h1 style="font-size:20px;font-weight:800;margin:0 0 8px">Tu as utilisé tes ${what} gratuites</h1>
      <p style="color:#8888A8;font-size:14px;line-height:1.6;margin:0 0 24px">
        ${name}, tu as atteint la limite de <strong style="color:#fff">${limit}</strong> sur le plan Gratuit.
        Pour continuer à créer sans interruption, passe à un plan supérieur.
      </p>

      <div style="background:#0d0d18;border:1px solid #5B5BD633;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#9B9BFF">Plans disponibles</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr style="border-bottom:1px solid #1e1e2a">
            <td style="padding:8px 4px;color:#C8C8E8;font-weight:600">Essentiel</td>
            <td style="padding:8px 4px;color:#8888A8">30 créations · musique</td>
            <td style="padding:8px 4px;color:#5B5BD6;font-weight:700;text-align:right">39 Dh/mois</td>
          </tr>
          <tr style="border-bottom:1px solid #1e1e2a">
            <td style="padding:8px 4px;color:#C8C8E8;font-weight:600">Créateur ⭐</td>
            <td style="padding:8px 4px;color:#8888A8">150 créations · domaine perso</td>
            <td style="padding:8px 4px;color:#5B5BD6;font-weight:700;text-align:right">99 Dh/mois</td>
          </tr>
          <tr>
            <td style="padding:8px 4px;color:#C8C8E8;font-weight:600">Fusion</td>
            <td style="padding:8px 4px;color:#8888A8">500 créations · vidéos illimitées</td>
            <td style="padding:8px 4px;color:#5B5BD6;font-weight:700;text-align:right">189 Dh/mois</td>
          </tr>
        </table>
      </div>

      <a href="https://grado.app/pricing" style="display:inline-block;background:#5B5BD6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">
        Voir les tarifs →
      </a>
    </div>
    ${FOOTER}
  </div>`;
  await send(to, `${emoji} Tu as atteint ta limite de ${what} — Grado`, html);
}

// ── 3. Plan activé (après approbation admin) ───────────────────────────────
export async function sendPlanActivatedEmail(to: string, name: string, plan: string): Promise<void> {
  const planLabels: Record<string, string> = {
    essentiel: "Essentiel",
    createur:  "Créateur",
    fusion:    "Fusion",
    elite:     "Élite",
  };
  const planName = planLabels[plan] || plan;

  const html = `<div style="${BASE}">
    ${LOGO}
    <div style="padding:32px 28px">
      <div style="font-size:36px;margin-bottom:12px">✅</div>
      <h1 style="font-size:20px;font-weight:800;margin:0 0 8px">Ton plan ${planName} est actif !</h1>
      <p style="color:#8888A8;font-size:14px;line-height:1.6;margin:0 0 24px">
        ${name}, ton paiement a été confirmé. Tu as maintenant accès à toutes les fonctionnalités du plan <strong style="color:#fff">${planName}</strong>.
      </p>

      <div style="background:#0d2010;border:1px solid #22c55e33;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#4ade80">
          🎉 Paiement vérifié et validé par notre équipe. Merci pour ta confiance !
        </p>
      </div>

      <a href="https://grado.app/chat" style="display:inline-block;background:#5B5BD6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">
        Accéder à Grado →
      </a>
    </div>
    ${FOOTER}
  </div>`;
  await send(to, `✅ Plan ${planName} activé — Grado`, html);
}
