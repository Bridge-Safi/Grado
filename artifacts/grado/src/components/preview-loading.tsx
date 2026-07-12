import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GradoLogo } from "./grado-logo";

const FUN_LINES = [
  "Grado chauffe les circuits... 🔥",
  "Le robot met le feu au dancefloor pendant que le code cuit...",
  "Assemblage pixel par pixel...",
  "Injection de magie numérique...",
  "Presque prêt à te scotcher...",
];

/**
 * Fun, on-brand loading screen shown in the live preview panel while
 * the agent is generating a project — replaces the plain blank/white
 * flash that used to appear before the HTML finished streaming.
 */
export function PreviewLoadingScreen() {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLineIdx((i) => (i + 1) % FUN_LINES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden border border-[#1e1e2a] flex flex-col items-center justify-center gap-6"
      style={{ background: "radial-gradient(circle at 50% 38%, #14142c 0%, #050508 72%)" }}
    >
      {/* dotted grid backdrop */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: "radial-gradient(rgba(123,123,255,0.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* floating sparkles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            background: i % 2 === 0 ? "#7B7BFF" : "#C4AFFF",
            boxShadow: "0 0 6px rgba(123,123,255,0.8)",
          }}
          animate={{ y: [0, -14, 0], opacity: [0.15, 1, 0.15] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}

      {/* dancing robot + glowing Grado bolt */}
      <div className="relative flex items-end gap-4 z-10">
        <motion.div
          animate={{ rotate: [-14, 14, -14], y: [0, -8, 0] }}
          transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
          className="text-5xl select-none"
          style={{ filter: "drop-shadow(0 0 14px rgba(123,123,255,0.55))" }}
        >
          🤖
        </motion.div>

        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div
            className="absolute inset-[-16px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(123,123,255,0.5), transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          <GradoLogo size={48} className="relative" />
        </motion.div>
      </div>

      {/* cycling fun status line */}
      <div className="h-5 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm font-medium text-center whitespace-nowrap"
            style={{
              background: "linear-gradient(90deg, #8888A8, #b0b0ff, #8888A8)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "grado-shimmer 2s linear infinite",
            }}
          >
            {FUN_LINES[lineIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* pulsing progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#7B7BFF]"
            animate={{ scale: [1, 1.7, 1], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>

      <style>{`
        @keyframes grado-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
