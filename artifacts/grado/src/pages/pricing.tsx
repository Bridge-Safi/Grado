import { useState } from "react";
import { Check, Zap, Loader2, ArrowRight, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { GradoLogo } from "@/components/grado-logo";
import { LangSwitcher } from "@/components/lang-switcher";
import { PaymentModal } from "@/components/payment-modal";

const PLANS = [
  {
    id: "gratuit",
    name: "Gratuit",
    tagline: "Pour explorer",
    price: 0,
    features: [
      "5 créations / mois",
      "3 chansons IA / mois",
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
    price: 39,
    features: [
      "30 créations / mois",
      "Génération musicale IA",
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
    price: 99,
    features: [
      "150 créations / mois",
      "Génération musicale IA",
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
    price: 189,
    features: [
      "500 créations / mois",
      "Génération vidéo IA",
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
    price: 359,
    features: [
      "Créations illimitées",
      "Vidéo + Musique illimités",
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
  const [paymentPlan, setPaymentPlan] = useState<typeof PLANS[0] | null>(null);
  const [pendingPlans, setPendingPlans] = useState<Set<string>>(new Set());

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

    setPaymentPlan(plan);
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
            className="mb-6 flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-5 py-2"
          >
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-semibold text-green-400">
              Compte créé ! Choisis ton plan pour continuer.
            </span>
          </motion.div>
        )}

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
          className="text-sm text-[#8888A8] text-center mb-12 max-w-md"
        >
          Paiement par virement bancaire ou QR code — Activation sous 24h
        </motion.p>

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
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    {plan.price > 0 ? (
                      <>
                        <span className="text-sm font-semibold text-white mb-0.5">Dh</span>
                        <span className="text-[#8888A8] text-xs mb-1">/mois</span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-[#8888A8] mb-0.5">Dh</span>
                    )}
                  </div>
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
                  { label: "Créations / mois",       vals: ["5", "30", "150", "500", "∞"] },
                  { label: "Hébergement de sites",    vals: ["1 site", "5 sites", "∞", "∞", "∞"] },
                  { label: "Génération musicale IA",  vals: ["3/mois", "✓", "✓", "✓", "✓"] },
                  { label: "Génération vidéo IA",     vals: ["✗", "✗", "✗", "✓", "✓"] },
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
          Paiement sécurisé par virement bancaire · Activation sous 24h · Prix en dirhams marocains (DH)
        </p>
      </div>
    </div>
  );
}
