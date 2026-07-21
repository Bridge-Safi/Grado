import { useState, useEffect } from "react";
import { Check, Zap, Loader2, ArrowRight, Star, Clock, Gift } from "lucide-react";

const NEW_USER_DISCOUNT = 0.08; // 8% — moins de 10%
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { GradoLogo } from "@/components/grado-logo";
import { LangSwitcher } from "@/components/lang-switcher";
import { PaymentModal } from "@/components/payment-modal";

type Currency = "MAD" | "EUR" | "USD";

const CURRENCIES: { code: Currency; symbol: string; flag: string; label: string }[] = [
  { code: "MAD", symbol: "Dh", flag: "🇲🇦", label: "MAD" },
  { code: "EUR", symbol: "€",  flag: "🇪🇺", label: "EUR" },
  { code: "USD", symbol: "$",  flag: "🇺🇸", label: "USD" },
];

// Prices per currency — rounded to market-competitive values
// Fusion et Élite ont été réajustés (juillet 2026) pour sécuriser la marge face au
// coût réel de la génération vidéo (très variable, 0,10€ à plusieurs € selon le
// modèle fal.ai) — voir lib/quota.ts pour le détail des nouveaux plafonds.
// Prix révisés (juillet 2026) pour assurer une marge positive sur chaque plan.
// Marge cible ≥ 40% même pour un utilisateur qui consomme 100% de son quota.
// Calcul : Créateur 150×0,05€=7,5€ coût → 12€ prix → marge 37%.
//          Fusion 300×0,05€+15vidéos×0,30€=19,5€ coût → 29€ prix → marge 33%.
//          Élite plafonné à 600 créations : 30€+9€=39€ coût → 59€ prix → marge 34%.
const PRICES: Record<string, Record<Currency, number>> = {
  gratuit:  { MAD: 0,   EUR: 0,  USD: 0  },
  essentiel:{ MAD: 49,  EUR: 5,  USD: 5  },
  createur: { MAD: 129, EUR: 12, USD: 13 },
  fusion:   { MAD: 299, EUR: 29, USD: 32 },
  elite:    { MAD: 599, EUR: 59, USD: 65 },
};

function detectCurrency(): Currency {
  const lang = navigator.language || "fr";
  if (lang.startsWith("ar") || lang.includes("MA") || lang.includes("DZ") || lang.includes("TN")) return "MAD";
  if (["en-US", "en-CA", "en-AU"].some(l => lang.startsWith(l.split("-")[0]) && lang.includes(l.split("-")[1]))) return "USD";
  if (lang.startsWith("en")) return "USD";
  return "EUR";
}

const PLANS = [
  {
    id: "gratuit",
    name: "Gratuit",
    tagline: "Pour explorer",
    features: [
      "5 créations / jour",
      "Aperçu en direct",
      "App web, jeux, dashboards",
      "Hébergement 1 site",
      "Support communauté",
    ],
    cta: "Commencer",
    popular: false,
    paid: false,
    highlight: false,
  },
  {
    id: "essentiel",
    name: "Essentiel",
    tagline: "Pour démarrer",
    features: [
      "30 créations / mois",
      "Tous les types de projets",
      "Hébergement 5 sites",
      "Téléchargement du code",
      "Support standard",
    ],
    cta: "Souscrire",
    popular: false,
    paid: true,
    highlight: false,
  },
  {
    id: "createur",
    name: "Créateur",
    tagline: "Le plus populaire",
    features: [
      "150 créations / mois",
      "Hébergement illimité",
      "Domaine personnalisé",
      "Support prioritaire",
    ],
    cta: "Souscrire",
    popular: true,
    paid: true,
    highlight: true,
  },
  {
    id: "fusion",
    name: "Fusion",
    tagline: "Pour les pros",
    features: [
      "300 créations / mois",
      "15 vidéos IA / mois",
      "Modèles IA avancés",
      "Accès API Grado",
      "Tout du plan Créateur",
    ],
    cta: "Souscrire",
    popular: false,
    paid: true,
    highlight: false,
  },
  {
    id: "elite",
    name: "Élite",
    tagline: "Sans limites",
    features: [
      "600 créations / mois",
      "30 vidéos IA / mois",
      "Modèles IA premium",
      "Support dédié 24/7",
      "Accès anticipé nouveautés",
    ],
    cta: "Souscrire",
    popular: false,
    paid: true,
    highlight: false,
  },
];

export default function PricingPage() {
  const { user, updatePlan } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<(typeof PLANS[0] & { price: number }) | null>(null);
  const [pendingPlans, setPendingPlans] = useState<Set<string>>(new Set());
  const [currency, setCurrency] = useState<Currency>("MAD");

  useEffect(() => {
    setCurrency(detectCurrency());
  }, []);

  const cur = CURRENCIES.find(c => c.code === currency)!;
  const getPrice = (planId: string) => PRICES[planId]?.[currency] ?? 0;

  const isOnboarding =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("onboard") === "1";

  const handleSelect = async (plan: typeof PLANS[0]) => {
    if (!user) { navigate("/register"); return; }
    if (user.plan === plan.id) { navigate("/chat"); return; }
    setError("");

    if (!plan.paid) {
      setLoading(plan.id);
      try {
        await updatePlan(plan.id);
        navigate("/chat");
      } catch (e: any) {
        setError(e.message || "Une erreur est survenue");
      } finally {
        setLoading(null);
      }
      return;
    }

    // Le virement se fait toujours en dirhams : on passe le prix MAD du plan
    // (avant, plan.price n'existait pas -> "Montant : Dh" VIDE dans la modale).
    setPaymentPlan({ ...plan, price: PRICES[plan.id]?.MAD ?? 0 });
  };

  const handlePaymentSuccess = (planId: string) => {
    setPendingPlans(prev => new Set([...prev, planId]));
    setPaymentPlan(null);
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col">
      {/* Payment Modal */}
      {paymentPlan && (
        <PaymentModal
          plan={paymentPlan}
          onClose={() => setPaymentPlan(null)}
          onSuccess={() => handlePaymentSuccess(paymentPlan.id)}
        />
      )}

      {/* Navbar */}
      <header className="h-12 border-b border-[#2a2a38] bg-[#050505] flex items-center px-5 gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2">
          <GradoLogo size={22} />
          <span className="text-sm font-semibold text-white tracking-tight">Grado</span>
        </a>
        <div className="flex-1" />
        <LangSwitcher compact />
        {user && (
          <a href="/chat" className="text-xs text-[#8888A8] hover:text-white transition-colors">
            Retour au chat →
          </a>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-14">
        {/* Onboarding banner */}
        {isOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-5 py-2"
          >
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-semibold text-green-400">
              Compte créé ! Choisis ton plan pour continuer.
            </span>
          </motion.div>
        )}

        {/* Promo banner — offre bienvenue */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="mb-6 relative overflow-hidden rounded-2xl border border-[#5B5BD6]/40 bg-gradient-to-r from-[#0d0d22] via-[#0e0e2e] to-[#0d0d22] px-5 py-3.5 flex items-center gap-4 max-w-2xl w-full shadow-[0_0_30px_rgba(91,91,214,0.15)]"
        >
          {/* Glow strip */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7B7BFF]/60 to-transparent" />
          <div className="w-8 h-8 rounded-xl bg-[#5B5BD6]/20 border border-[#5B5BD6]/30 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4 text-[#7B7BFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">
              Offre de bienvenue{" "}
              <span className="bg-[#5B5BD6]/30 text-[#9B9BFF] px-1.5 py-0.5 rounded font-mono tracking-wide text-[10px]">−8%</span>
              {" "}sur ton premier abonnement
            </p>
            <p className="text-[11px] text-[#7B7BFF]/70 mt-0.5">
              Mentionne <span className="font-mono font-semibold text-[#9B9BFF]">BIENVENUE</span> dans le motif du virement pour bénéficier de la réduction.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 shrink-0 bg-[#5B5BD6]/15 border border-[#5B5BD6]/25 rounded-lg px-3 py-2">
            <Zap className="w-3 h-3 text-[#7B7BFF]" />
            <span className="text-[11px] font-bold text-[#9B9BFF]">Offre limitée</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl md:text-4xl font-bold text-white text-center mb-3"
        >
          {isOnboarding ? "Quel plan te correspond ?" : "Choisissez votre niveau"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[#8888A8] text-center mb-6 max-w-md"
        >
          Paiement par virement bancaire ou QR code — Activation sous 24h
        </motion.p>

        {/* Currency switcher */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-1 bg-[#0a0a10] border border-[#2a2a38] rounded-xl p-1 mb-10"
        >
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                currency === c.code
                  ? "bg-[#5B5BD6] text-white shadow-[0_0_12px_rgba(91,91,214,0.4)]"
                  : "text-[#8888A8] hover:text-white"
              )}
            >
              <span>{c.flag}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </motion.div>

        {error && (
          <div className="mb-6 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-6xl">
          {PLANS.map((plan, i) => {
            const isCurrent = user?.plan === plan.id;
            const isLoading = loading === plan.id;
            const isPending = pendingPlans.has(plan.id);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                className={cn(
                  "relative rounded-2xl border p-5 flex flex-col gap-4",
                  plan.highlight
                    ? "border-[#5B5BD6] bg-gradient-to-b from-[#0E0E28] to-[#050505] shadow-[0_0_50px_rgba(91,91,214,0.25)]"
                    : "border-[#2a2a38] bg-[#050505]",
                  isCurrent && "ring-2 ring-[#5B5BD6]/50"
                )}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#5B5BD6] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-2.5 h-2.5" /> Populaire
                    </span>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Actuel
                    </span>
                  </div>
                )}

                {/* Pending badge */}
                {isPending && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-yellow-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> En attente
                    </span>
                  </div>
                )}

                {/* Header */}
                <div>
                  <p className={cn(
                    "text-xs font-semibold mb-1",
                    plan.highlight ? "text-[#9B9BFF]" : "text-[#8888A8]"
                  )}>
                    {plan.tagline}
                  </p>
                  <p className="text-base font-bold text-white">{plan.name}</p>
                  {(() => {
                    const price = getPrice(plan.id);
                    const discounted = price > 0 ? Math.round(price * (1 - NEW_USER_DISCOUNT)) : 0;
                    return (
                      <div className="mt-2">
                        {price > 0 && (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs text-[#555568] line-through">
                              {currency !== "EUR" && cur.symbol}{price}{currency === "EUR" && cur.symbol}
                            </span>
                            <span className="text-[9px] font-bold bg-[#5B5BD6]/25 text-[#9B9BFF] px-1.5 py-0.5 rounded-full uppercase tracking-wide">−8%</span>
                          </div>
                        )}
                        <div className="flex items-end gap-1">
                          {currency !== "EUR" && price > 0 && (
                            <span className="text-sm font-semibold text-white mb-0.5">{cur.symbol}</span>
                          )}
                          <span className="text-3xl font-bold text-white">{price > 0 ? discounted : 0}</span>
                          {price > 0 ? (
                            <>
                              {currency === "EUR" && <span className="text-sm font-semibold text-white mb-0.5">{cur.symbol}</span>}
                              <span className="text-[#8888A8] text-xs mb-1">/mois</span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-[#8888A8] mb-0.5">Gratuit</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Payment badge */}
                {plan.paid && (
                  <div className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
                    plan.highlight
                      ? "bg-[#5B5BD6]/20 border border-[#5B5BD6]/30"
                      : "bg-[#1e1e2a] border border-[#2a2a38]"
                  )}>
                    <span className="text-[10px] text-[#7B7BFF] font-medium">💳 QR code · Virement bancaire</span>
                  </div>
                )}

                {/* Features */}
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#C8C8E8]">
                      <Check className={cn(
                        "w-3.5 h-3.5 shrink-0 mt-0.5",
                        plan.highlight ? "text-[#7B7BFF]" : "text-[#5B5BD6]"
                      )} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isPending && !isCurrent ? (
                  <button disabled className="w-full py-2 rounded-xl bg-yellow-600/20 border border-yellow-600/30 text-yellow-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Vérification en cours…
                  </button>
                ) : isCurrent ? (
                  <button
                    onClick={() => navigate("/chat")}
                    className="w-full py-2 rounded-xl border border-[#5B5BD6]/30 text-[#7B7BFF] text-xs font-semibold hover:bg-[#5B5BD6]/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    Continuer <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelect(plan)}
                    disabled={isLoading}
                    className={cn(
                      "w-full py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5",
                      plan.highlight
                        ? "bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_14px_rgba(91,91,214,0.4)] disabled:opacity-60"
                        : "bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white border border-[#3a3a50] disabled:opacity-60"
                    )}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Activation...</>
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-14 w-full max-w-6xl"
        >
          <h2 className="text-lg font-bold text-white text-center mb-6">Comparaison des plans</h2>
          <div className="overflow-x-auto rounded-2xl border border-[#2a2a38]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a38] bg-[#050505]">
                  <th className="text-left px-5 py-3 text-[#8888A8] font-medium">Fonctionnalité</th>
                  {PLANS.map(p => (
                    <th key={p.id} className={cn(
                      "px-4 py-3 text-center font-semibold text-xs",
                      p.highlight ? "text-[#9B9BFF]" : "text-white"
                    )}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2a] bg-[#000000]">
                {[
                  { label: "Créations / mois",       vals: ["5", "30", "150", "300", "∞"] },
                  { label: "Hébergement de sites",    vals: ["1 site", "5 sites", "∞", "∞", "∞"] },
                  { label: "Génération vidéo IA",     vals: ["✗", "✗", "✗", "15/mois", "30/mois"] },
                  { label: "Domaine personnalisé",    vals: ["✗", "✗", "✓", "✓", "✓"] },
                  { label: "Accès API Grado",         vals: ["✗", "✗", "✗", "✓", "✓"] },
                  { label: "Modèles IA premium",      vals: ["✗", "✗", "✗", "✗", "✓"] },
                  { label: "Support",                 vals: ["Communauté", "Standard", "Prioritaire", "Prioritaire", "Dédié 24/7"] },
                ].map(({ label, vals }) => (
                  <tr key={label} className="hover:bg-[#050505]/60 transition-colors">
                    <td className="px-5 py-3 text-[#C8C8E8]">{label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={cn(
                        "px-4 py-3 text-center text-xs",
                        v === "✓" ? "text-green-400 font-bold" :
                        v === "✗" ? "text-[#555568]" :
                        PLANS[i].highlight ? "text-[#9B9BFF] font-semibold" : "text-[#C8C8E8]"
                      )}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="mt-8 text-xs text-[#8888A8] text-center max-w-sm">
          Paiement sécurisé par virement bancaire · Activation sous 24h ·{" "}
          Prix affichés en{" "}
          {currency === "MAD" ? "dirhams marocains (MAD)" : currency === "EUR" ? "euros (EUR)" : "dollars américains (USD)"}
        </p>
      </div>
    </div>
  );
}
