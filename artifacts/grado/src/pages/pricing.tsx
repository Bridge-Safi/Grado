import { useState } from "react";
import { Check, Zap, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { GradoLogo } from "@/components/grado-logo";
import { LangSwitcher } from "@/components/lang-switcher";

const PLANS = [
  {
    id: "gratuit",
    name: "Gratuit",
    price: 0,
    period: "Pour commencer",
    features: ["Agent IA de base", "10 générations / mois", "Support communautaire"],
    cta: "Choisir ce plan",
    popular: false,
    paid: false,
  },
  {
    id: "hacker",
    name: "Hacker",
    price: 80,
    period: "Pour les passionnés",
    features: ["Agent IA avancé", "Générations illimitées", "Vidéos & Musique IA", "Support prioritaire"],
    cta: "Commencer l'essai gratuit",
    popular: true,
    paid: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    period: "Pour les experts",
    features: ["Modèles IA personnalisés", "Accès API complet", "Support dédié 24/7", "Tout du plan Hacker"],
    cta: "Commencer l'essai gratuit",
    popular: false,
    paid: true,
  },
];

export default function PricingPage() {
  const { user, updatePlan } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isOnboarding = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("onboard") === "1";

  const handleSelect = async (planId: string) => {
    if (!user) { navigate("/register"); return; }
    if (user.plan === planId) { navigate("/chat"); return; }

    setError("");
    setLoading(planId);
    try {
      await updatePlan(planId);
      setSuccess(planId);
      setTimeout(() => navigate("/chat"), 1200);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] flex flex-col">
      {/* Navbar */}
      <header className="h-12 border-b border-[#2a2a38] bg-[#111118] flex items-center px-5 gap-3 shrink-0">
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

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center px-4 py-14">
        {/* Onboarding header */}
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

        {/* Promo banner */}
        {!isOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-2 bg-[#5B5BD6]/15 border border-[#5B5BD6]/30 rounded-full px-5 py-2"
          >
            <Zap className="w-3.5 h-3.5 text-[#5B5BD6]" />
            <span className="text-xs font-semibold text-[#5B5BD6]">-50% les 3 premiers mois</span>
            <span className="text-xs text-[#8888A8]">· Offre de lancement</span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl md:text-4xl font-bold text-white text-center mb-3"
        >
          {isOnboarding ? "Quel plan te correspond ?" : "Choisissez Votre Plan de Puissance"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[#8888A8] text-center mb-12 max-w-md"
        >
          Essai gratuit 48h sur tous les plans payants — aucune carte bancaire requise
        </motion.p>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {PLANS.map((plan, i) => {
            const isCurrent = user?.plan === plan.id;
            const isLoading = loading === plan.id;
            const isDone = success === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className={cn(
                  "relative rounded-2xl border p-7 flex flex-col gap-5",
                  plan.popular
                    ? "border-[#5B5BD6] bg-[#111118] shadow-[0_0_40px_rgba(91,91,214,0.2)]"
                    : "border-[#2a2a38] bg-[#111118]",
                  isCurrent && "ring-2 ring-[#5B5BD6]/40"
                )}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#5B5BD6] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Populaire
                    </span>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <div className="absolute -top-3.5 right-5">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Plan actuel
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <div>
                  <p className="text-sm text-[#8888A8] mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    {plan.price > 0 ? (
                      <>
                        <span className="text-xl font-semibold text-white mb-1.5">Dh</span>
                        <span className="text-[#8888A8] text-sm mb-2">/mois</span>
                      </>
                    ) : (
                      <span className="text-xl font-semibold text-white mb-1.5">Dh</span>
                    )}
                  </div>
                  {plan.price > 0 && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="line-through text-[#8888A8] text-sm">{plan.price} Dh/mois</span>
                      <span className="bg-green-500/15 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{Math.round(plan.price * 0.5)} Dh · 3 mois
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-[#8888A8] mt-1">{plan.period}</p>
                </div>

                {/* 48h trial badge for paid plans */}
                {plan.paid && (
                  <div className="flex items-center gap-1.5 bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 rounded-lg px-3 py-2">
                    <span className="text-xs text-[#5B5BD6] font-medium">⏱ Accès gratuit 48h · Aucune carte</span>
                  </div>
                )}

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#C8C8E8]">
                      <Check className="w-4 h-4 text-[#5B5BD6] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isDone ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Plan activé — redirection...
                  </button>
                ) : isCurrent ? (
                  <button
                    onClick={() => navigate("/chat")}
                    className="w-full py-2.5 rounded-xl border border-[#5B5BD6]/30 text-[#7B7BFF] text-sm font-medium hover:bg-[#5B5BD6]/10 transition-colors flex items-center justify-center gap-2"
                  >
                    Continuer <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelect(plan.id)}
                    disabled={isLoading}
                    className={cn(
                      "w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2",
                      plan.popular
                        ? "bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_16px_rgba(91,91,214,0.4)] disabled:opacity-60"
                        : "bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white border border-[#5B5BD6]/40 disabled:opacity-60"
                    )}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Activation...</>
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-xs text-[#8888A8] text-center max-w-sm">
          Paiement sécurisé · Annulation à tout moment · Les prix sont en dirhams marocains (DH)
        </p>
      </div>
    </div>
  );
}
