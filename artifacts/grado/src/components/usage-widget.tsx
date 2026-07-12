import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, X } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface UsageData {
  plan: string;
  used: number;
  limit: number | null;
}

const PLAN_LABELS: Record<string, string> = {
  gratuit: "Gratuit",
  essentiel: "Essentiel",
  createur: "Créateur",
  fusion: "Fusion",
  elite: "Elite",
};

const PLAN_COLORS: Record<string, { bar: string; text: string; border: string }> = {
  gratuit:  { bar: "bg-[#5B5BD6]",      text: "text-[#7B7BFF]",   border: "border-[#5B5BD6]/40" },
  essentiel:{ bar: "bg-blue-500",        text: "text-blue-400",    border: "border-blue-500/40" },
  createur: { bar: "bg-violet-500",      text: "text-violet-400",  border: "border-violet-500/40" },
  fusion:   { bar: "bg-purple-500",      text: "text-purple-400",  border: "border-purple-500/40" },
  elite:    { bar: "bg-amber-500",       text: "text-amber-400",   border: "border-amber-500/40" },
};

export function UsageWidget({ token }: { token: string | null }) {
  const [data, setData] = useState<UsageData | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/usage", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, [token]);

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!data) return null;

  const { plan, used, limit } = data;
  const isElite = limit === null;
  const pct = isElite ? 100 : Math.min(100, Math.round((used / limit!) * 100));
  const colors = PLAN_COLORS[plan] ?? PLAN_COLORS.gratuit;
  const isWarning = !isElite && pct >= 80;
  const isDanger  = !isElite && pct >= 100;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium border transition-all",
          open
            ? "bg-[#1a1a2a] border-[#5B5BD6]/50 text-white"
            : "bg-[#0A0A0A] border-[#2a2a38] text-[#8888A8] hover:text-white hover:border-[#5B5BD6]/30"
        )}
      >
        {isElite ? (
          <span className="text-amber-400">∞</span>
        ) : (
          <>
            {/* mini barre */}
            <div className="w-14 h-1.5 rounded-full bg-[#1e1e2a] overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", isDanger ? "bg-red-500" : isWarning ? "bg-orange-500" : colors.bar)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={cn(isDanger ? "text-red-400" : isWarning ? "text-orange-400" : colors.text)}>
              {pct}%
            </span>
          </>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-9 w-72 bg-[#0D0D12] border border-[#2a2a38] rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#1e1e2a]">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                {isElite ? "Accès illimité" : "Limites d'utilisation"}
              </span>
              <button onClick={() => setOpen(false)} className="text-[#5555A8] hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Usage row */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1a1a2a] border border-[#2a2a38] flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-[#7B7BFF]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Créations ce mois</p>
                    <p className="text-[10px] text-[#5555A8]">Apps, sites, jeux, musique…</p>
                  </div>
                </div>
                <span className={cn("text-sm font-bold", isDanger ? "text-red-400" : isWarning ? "text-orange-400" : colors.text)}>
                  {isElite ? "∞" : `${used}/${limit}`}
                </span>
              </div>

              {!isElite && (
                <div className="w-full h-2 rounded-full bg-[#1e1e2a] overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", isDanger ? "bg-red-500" : isWarning ? "bg-orange-500" : colors.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              )}

              {isElite && (
                <div className="w-full h-2 rounded-full bg-gradient-to-r from-amber-500/60 via-amber-400 to-amber-500/60" />
              )}

              {isDanger && (
                <p className="text-[10px] text-red-400 mt-1.5">
                  Quota atteint — tes créations reprennent le 1er du mois.
                </p>
              )}
              {isWarning && !isDanger && (
                <p className="text-[10px] text-orange-400 mt-1.5">
                  Tu approches de ta limite mensuelle.
                </p>
              )}
            </div>

            {/* Plan actuel */}
            <div className="px-4 pb-3">
              <div className={cn("flex items-center justify-between px-3 py-2 rounded-xl border", colors.border, "bg-[#0A0A10]")}>
                <span className="text-[10px] text-[#8888A8]">Plan actuel</span>
                <span className={cn("text-xs font-bold capitalize", colors.text)}>
                  {PLAN_LABELS[plan] ?? plan}
                </span>
              </div>
            </div>

            {/* Upgrade button — seulement pour les non-elite */}
            {plan !== "elite" && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => { setOpen(false); navigate("/pricing"); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4a4ac4] text-white text-xs font-semibold transition-all shadow-[0_0_16px_rgba(91,91,214,0.3)] hover:shadow-[0_0_20px_rgba(91,91,214,0.5)]"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {plan === "gratuit" ? "Passer à Essentiel" : "Passer au plan supérieur"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
