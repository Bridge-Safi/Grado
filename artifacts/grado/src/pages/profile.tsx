import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Sparkles, CreditCard, Copy, CheckCheck, Mail, User as UserIcon,
  Zap, Rocket, Settings as SettingsIcon, Globe, MessageCircle,
} from "lucide-react";
import { GradoLogo } from "@/components/grado-logo";
import { useAuth } from "@/lib/auth";

type Usage = { plan: string; used: number; limit: number | null };
type PayConfig = { iban: string; holder: string; phone: string; bank: string; paypal: string };

const PLAN_LABELS: Record<string, { name: string; color: string; emoji: string }> = {
  gratuit: { name: "Gratuit", color: "#8888A8", emoji: "🌱" },
  essentiel: { name: "Essentiel", color: "#22c55e", emoji: "⚡" },
  createur: { name: "Créateur", color: "#5B5BD6", emoji: "🚀" },
  fusion: { name: "Fusion", color: "#a855f7", emoji: "🔥" },
  elite: { name: "Élite", color: "#f59e0b", emoji: "👑" },
};

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [pay, setPay] = useState<PayConfig | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("grado_token");
    fetch("/api/auth/usage", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUsage(d))
      .catch(() => {});
    fetch("/api/payments/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPay(d))
      .catch(() => {});
  }, []);

  const plan = PLAN_LABELS[user?.plan ?? "gratuit"] ?? PLAN_LABELS.gratuit;
  const pct = usage && usage.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const remaining = usage && usage.limit != null ? Math.max(0, usage.limit - usage.used) : null;
  const initial = (user?.name ?? "?").trim().charAt(0).toUpperCase();

  const copyIban = () => {
    if (!pay?.iban) return;
    navigator.clipboard?.writeText(pay.iban).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e1e2a]/80 bg-[#000000]/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-1.5 text-sm text-[#8888A8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au chat
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            <GradoLogo size={22} />
            <span className="text-sm font-bold tracking-tight">Grado</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 pt-24 pb-24 space-y-6">
        {/* ── Carte identité ── */}
        <div className="relative overflow-hidden rounded-3xl border border-[#1e1e2a] bg-gradient-to-br from-[#0e0e16] to-[#0a0a0f] p-6">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#5B5BD6]/15 blur-3xl" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#5B5BD6] flex items-center justify-center text-2xl font-black shadow-[0_0_24px_rgba(91,91,214,0.4)]">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold truncate">{user?.name ?? "Mon compte"}</h1>
              <p className="text-sm text-[#8888A8] flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {user?.email}
              </p>
            </div>
            <div
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{ color: plan.color, borderColor: `${plan.color}55`, background: `${plan.color}15` }}
            >
              {plan.emoji} {plan.name}
            </div>
          </div>
        </div>

        {/* ── Consommation ── */}
        <div className="rounded-3xl border border-[#1e1e2a] bg-[#0a0a0f] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#8888A8] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#5B5BD6]" /> Ma consommation du mois
            </h2>
            {usage?.limit == null && usage && (
              <span className="text-xs font-bold text-amber-400">∞ Illimité</span>
            )}
          </div>
          {usage ? (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-black">{usage.used}</span>
                <span className="text-sm text-[#8888A8]">
                  / {usage.limit == null ? "∞" : usage.limit} créations
                </span>
                {remaining != null && (
                  <span className="ml-auto text-xs font-semibold" style={{ color: remaining === 0 ? "#f87171" : "#22c55e" }}>
                    {remaining === 0 ? "Quota atteint" : `${remaining} restantes`}
                  </span>
                )}
              </div>
              {usage.limit != null && (
                <div className="w-full h-2.5 rounded-full bg-[#1e1e2a] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "linear-gradient(90deg,#8B5CF6,#5B5BD6)",
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-[#8888A8]">Chargement…</p>
          )}
          <button
            onClick={() => navigate("/pricing")}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#8B5CF6] to-[#5B5BD6] hover:opacity-90 transition-opacity shadow-[0_0_18px_rgba(91,91,214,0.35)]"
          >
            <Rocket className="w-4 h-4" />
            {usage && usage.limit != null && usage.used >= usage.limit ? "Recharger — passer au plan supérieur" : "Voir les plans & recharger"}
          </button>
        </div>

        {/* ── Coordonnées de paiement ── */}
        <div className="rounded-3xl border border-[#1e1e2a] bg-[#0a0a0f] p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#8888A8] flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[#5B5BD6]" /> Coordonnées pour recharger (virement)
          </h2>
          {pay?.iban ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 bg-[#000000] border border-[#1e1e2a] rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-[#8888A8]">IBAN / RIB</p>
                  <p className="text-sm font-mono text-white truncate">{pay.iban}</p>
                </div>
                <button
                  onClick={copyIban}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#7B7BFF] hover:text-white border border-[#5B5BD6]/40 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#000000] border border-[#1e1e2a] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8888A8]">Titulaire</p>
                  <p className="text-sm text-white">{pay.holder}</p>
                </div>
                <div className="bg-[#000000] border border-[#1e1e2a] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8888A8]">Banque</p>
                  <p className="text-sm text-white">{pay.bank || "—"}</p>
                </div>
              </div>
              <p className="text-xs text-[#8888A8]">
                💡 Mets la <strong className="text-white">référence affichée au moment du paiement</strong> dans le motif du virement — activation sous 2 à 24 h.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#8888A8]">Les coordonnées de virement s'affichent au moment du choix d'un plan sur la page Tarifs.</p>
          )}
        </div>

        {/* ── Raccourcis ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2.5 rounded-2xl border border-[#1e1e2a] bg-[#0a0a0f] px-4 py-3.5 text-sm text-[#C8C8E8] hover:border-[#5B5BD6]/50 hover:text-white transition-colors"
          >
            <SettingsIcon className="w-4 h-4 text-[#5B5BD6]" /> Paramètres & mot de passe
          </button>
          <button
            onClick={() => navigate("/sites")}
            className="flex items-center gap-2.5 rounded-2xl border border-[#1e1e2a] bg-[#0a0a0f] px-4 py-3.5 text-sm text-[#C8C8E8] hover:border-[#5B5BD6]/50 hover:text-white transition-colors"
          >
            <Globe className="w-4 h-4 text-[#5B5BD6]" /> Mes sites hébergés
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="flex items-center gap-2.5 rounded-2xl border border-[#1e1e2a] bg-[#0a0a0f] px-4 py-3.5 text-sm text-[#C8C8E8] hover:border-[#5B5BD6]/50 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#5B5BD6]" /> Contact & support
          </button>
        </div>

        <p className="text-center text-xs text-[#8888A8]/60 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Grado · Construis. Imagine. Crée.
        </p>
      </main>
    </div>
  );
}
