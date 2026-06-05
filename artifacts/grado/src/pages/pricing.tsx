import { useState } from "react";
import { Check, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import logoUrl from "@assets/D589D749-E25A-4876-ACE2-D9DFD1C31E5C_1780620985737.png";

const PLANS = [
  {
    id: "gratuit",
    name: "Gratuit",
    price: 0,
    period: "Pour commencer",
    features: ["Agent IA de base", "10 générations / mois", "Support communautaire"],
    cta: "Plan Actuel",
    popular: false,
    disabled: true,
    trial: true,
  },
  {
    id: "hacker",
    name: "Hacker",
    price: 80,
    period: "Pour les passionnés",
    features: ["Agent IA avancé", "Générations illimitées", "Vidéos & Musique IA", "Support prioritaire"],
    cta: "S'abonner",
    popular: true,
    disabled: false,
    trial: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    period: "Pour les experts",
    features: ["Modèles IA personnalisés", "Accès API complet", "Support dédié 24/7", "Tout du plan Hacker"],
    cta: "S'abonner",
    popular: false,
    disabled: false,
    trial: true,
  },
];

export default function PricingPage() {
  const [trialStarted, setTrialStarted] = useState<string | null>(null);

  const handleTrial = (planId: string) => {
    setTrialStarted(planId);
    setTimeout(() => setTrialStarted(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] flex flex-col">
      {/* Navbar */}
      <header className="h-12 border-b border-[#2a2a38] bg-[#111118] flex items-center px-5 gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="Grado" className="w-5 h-5 object-contain" />
          <span className="text-sm font-semibold text-white tracking-tight">Grado</span>
        </a>
        <div className="flex-1" />
        <span className="text-xs text-[#8888A8]">🇫🇷 FR</span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center px-4 py-14">
        {/* Promo banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-2 bg-[#5B5BD6]/15 border border-[#5B5BD6]/30 rounded-full px-5 py-2"
        >
          <Zap className="w-3.5 h-3.5 text-[#5B5BD6]" />
          <span className="text-xs font-semibold text-[#5B5BD6]">-50% les 3 premiers mois</span>
          <span className="text-xs text-[#8888A8]">· Offre de lancement</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl md:text-4xl font-bold text-white text-center mb-3"
        >
          Choisissez Votre Plan de Puissance
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[#8888A8] text-center mb-12 max-w-md"
        >
          Essai gratuit 48h sur tous les plans payants — aucune carte bancaire requise
        </motion.p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className={cn(
                "relative rounded-2xl border p-7 flex flex-col gap-5",
                plan.popular
                  ? "border-[#5B5BD6] bg-[#111118] shadow-[0_0_40px_rgba(91,91,214,0.2)]"
                  : "border-[#2a2a38] bg-[#111118]"
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

              {/* Plan name */}
              <div>
                <p className="text-sm text-[#8888A8] mb-1">{plan.name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  {plan.price > 0 && (
                    <>
                      <span className="text-xl font-semibold text-white mb-1.5">Dh</span>
                      <span className="text-[#8888A8] text-sm mb-2">/mois</span>
                    </>
                  )}
                  {plan.price === 0 && (
                    <span className="text-xl font-semibold text-white mb-1.5">Dh</span>
                  )}
                </div>
                {/* -50% badge for paid plans */}
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

              {/* 48h trial badge */}
              {plan.price > 0 && (
                <div className="flex items-center gap-1.5 bg-[#5B5BD6]/10 border border-[#5B5BD6]/20 rounded-lg px-3 py-2">
                  <span className="text-xs text-[#5B5BD6] font-medium">⏱ Accès gratuit 48h</span>
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
              {plan.disabled ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl border border-[#2a2a38] text-[#8888A8] text-sm font-medium cursor-default"
                >
                  {plan.cta}
                </button>
              ) : trialStarted === plan.id ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Essai activé — 48h gratuit !
                </button>
              ) : (
                <button
                  onClick={() => handleTrial(plan.id)}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                    plan.popular
                      ? "bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white shadow-[0_0_16px_rgba(91,91,214,0.4)]"
                      : "bg-[#1e1e2e] hover:bg-[#2a2a3e] text-white border border-[#5B5BD6]/40"
                  )}
                >
                  {plan.cta}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-xs text-[#8888A8] text-center max-w-sm">
          Paiement sécurisé · Annulation à tout moment · Les prix sont en dirhams marocains (DH)
        </p>
      </div>
    </div>
  );
}
