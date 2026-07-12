import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FUN_LINES = [
  "Grado chauffe les circuits... 🔥",
  "Le robot met le feu au dancefloor pendant que le code cuit...",
  "Assemblage pixel par pixel...",
  "Injection de magie numérique...",
  "Presque prêt à te scotcher...",
];

/** Robot SVG complet avec tête, corps, bras, jambes et pieds */
function DancingRobot() {
  return (
    <motion.div
      style={{ filter: "drop-shadow(0 0 18px rgba(123,123,255,0.6))" }}
      className="select-none"
    >
      <svg width="90" height="130" viewBox="0 0 90 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Antennes */}
        <motion.line
          x1="35" y1="10" x2="28" y2="2"
          stroke="#7B7BFF" strokeWidth="2.5" strokeLinecap="round"
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "35px 10px" }}
        />
        <circle cx="26" cy="1.5" r="3" fill="#FF6B9D" />
        <motion.line
          x1="55" y1="10" x2="62" y2="2"
          stroke="#7B7BFF" strokeWidth="2.5" strokeLinecap="round"
          animate={{ rotate: [10, -10, 10] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "55px 10px" }}
        />
        <circle cx="64" cy="1.5" r="3" fill="#FFD93D" />

        {/* Tête */}
        <rect x="22" y="8" width="46" height="38" rx="12" fill="#1a1a2e" stroke="#7B7BFF" strokeWidth="2" />
        {/* Visière/écran */}
        <rect x="27" y="13" width="36" height="22" rx="7" fill="#0d0d1a" stroke="#5B5BD6" strokeWidth="1.5" />
        {/* Yeux */}
        <motion.circle
          cx="37" cy="24" r="6" fill="#7B7BFF"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1] }}
          style={{ transformOrigin: "37px 24px" }}
        />
        <motion.circle
          cx="53" cy="24" r="6" fill="#7B7BFF"
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1], delay: 0.05 }}
          style={{ transformOrigin: "53px 24px" }}
        />
        <circle cx="38.5" cy="22.5" r="2" fill="white" opacity="0.7" />
        <circle cx="54.5" cy="22.5" r="2" fill="white" opacity="0.7" />
        {/* Bouche / sourire */}
        <path d="M34 34 Q45 40 56 34" stroke="#7B7BFF" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Cou */}
        <rect x="40" y="46" width="10" height="6" rx="2" fill="#2a2a4a" stroke="#5B5BD6" strokeWidth="1" />

        {/* Corps */}
        <rect x="18" y="52" width="54" height="38" rx="10" fill="#1a1a2e" stroke="#7B7BFF" strokeWidth="2" />
        {/* Panneau de contrôle */}
        <rect x="26" y="59" width="38" height="22" rx="6" fill="#0d0d1a" stroke="#5B5BD6" strokeWidth="1.5" />
        {/* Boutons */}
        <motion.circle cx="35" cy="67" r="4" fill="#FF6B9D"
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
        <motion.circle cx="45" cy="67" r="4" fill="#FFD93D"
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
        <motion.circle cx="55" cy="67" r="4" fill="#6BFF9E"
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }} />
        {/* Barre de progression */}
        <rect x="30" y="75" width="30" height="3" rx="1.5" fill="#2a2a4a" />
        <motion.rect x="30" y="75" height="3" rx="1.5" fill="#7B7BFF"
          animate={{ width: [0, 30, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />

        {/* Bras gauche */}
        <motion.g
          animate={{ rotate: [-35, 35, -35] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "18px 60px" }}
        >
          <rect x="4" y="55" width="14" height="32" rx="7" fill="#1a1a2e" stroke="#7B7BFF" strokeWidth="2" />
          {/* Main gauche */}
          <rect x="2" y="85" width="18" height="10" rx="5" fill="#2a2a4a" stroke="#7B7BFF" strokeWidth="1.5" />
        </motion.g>

        {/* Bras droit */}
        <motion.g
          animate={{ rotate: [35, -35, 35] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "72px 60px" }}
        >
          <rect x="72" y="55" width="14" height="32" rx="7" fill="#1a1a2e" stroke="#7B7BFF" strokeWidth="2" />
          {/* Main droite */}
          <rect x="70" y="85" width="18" height="10" rx="5" fill="#2a2a4a" stroke="#7B7BFF" strokeWidth="1.5" />
        </motion.g>

        {/* Jambe gauche */}
        <motion.g
          animate={{ rotate: [20, -20, 20] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "35px 90px" }}
        >
          <rect x="25" y="88" width="16" height="28" rx="7" fill="#1a1a2e" stroke="#7B7BFF" strokeWidth="2" />
          {/* Pied gauche */}
          <rect x="20" y="113" width="24" height="10" rx="5" fill="#2a2a4a" stroke="#7B7BFF" strokeWidth="1.5" />
        </motion.g>

        {/* Jambe droite */}
        <motion.g
          animate={{ rotate: [-20, 20, -20] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "55px 90px" }}
        >
          <rect x="49" y="88" width="16" height="28" rx="7" fill="#1a1a2e" stroke="#7B7BFF" strokeWidth="2" />
          {/* Pied droit */}
          <rect x="46" y="113" width="24" height="10" rx="5" fill="#2a2a4a" stroke="#7B7BFF" strokeWidth="1.5" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

/**
 * Fun, on-brand loading screen shown in the live preview panel while
 * the agent is generating a project.
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

      {/* Robot dansant */}
      <motion.div
        className="z-10"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
      >
        <DancingRobot />
      </motion.div>

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
