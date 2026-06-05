import { useEffect, useState } from "react";

const STEPS = [
  { icon: "🧠", label: "Analyse de ta demande..." },
  { icon: "🏗️", label: "Conception de l'architecture..." },
  { icon: "⚙️", label: "Génération du code HTML..." },
  { icon: "🎨", label: "Application du design..." },
  { icon: "✨", label: "Optimisation des animations..." },
  { icon: "🔍", label: "Vérification du rendu..." },
  { icon: "🚀", label: "Finalisation du projet..." },
];

export function SharkCoding() {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(8);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIdx((prev) => {
        const next = Math.min(prev + 1, STEPS.length - 1);
        setCompletedSteps((c) => (c.includes(prev) ? c : [...c, prev]));
        return next;
      });
    }, 1800);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const pTimer = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 6, 94));
    }, 400);
    return () => clearInterval(pTimer);
  }, []);

  // alien blink
  useEffect(() => {
    const b = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 3200);
    return () => clearInterval(b);
  }, []);

  return (
    <div className="flex flex-col gap-4" style={{ width: 260 }}>

      {/* ── Alien + bolt scene ── */}
      <div
        className="relative flex items-center justify-center rounded-xl overflow-hidden"
        style={{
          height: 130,
          background: "linear-gradient(160deg, #0d0d18 0%, #111128 100%)",
          border: "1px solid rgba(91,91,214,0.18)",
        }}
      >
        {/* Background glow */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 140, height: 140,
            background: "radial-gradient(circle, rgba(91,91,214,0.18) 0%, transparent 70%)",
            animation: "glow-pulse 2s ease-in-out infinite",
          }}
        />

        {/* Orbit ring */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 100, height: 100,
            border: "1px dashed rgba(91,91,214,0.2)",
            animation: "spin-slow 8s linear infinite",
          }}
        />

        {/* Alien SVG */}
        <div
          style={{
            position: "absolute",
            left: 22,
            bottom: 18,
            animation: "alien-float 2.2s ease-in-out infinite",
            zIndex: 2,
          }}
        >
          <svg width="52" height="62" viewBox="0 0 52 62" fill="none">
            {/* Body */}
            <ellipse cx="26" cy="38" rx="16" ry="18" fill="#3b3b7a" />
            {/* Suit sheen */}
            <ellipse cx="26" cy="34" rx="10" ry="12" fill="rgba(91,91,214,0.25)" />
            {/* Head */}
            <ellipse cx="26" cy="18" rx="14" ry="16" fill="#5B5BD6" />
            {/* Head sheen */}
            <ellipse cx="22" cy="12" rx="5" ry="6" fill="rgba(180,180,255,0.2)" />
            {/* Eyes */}
            <ellipse cx="20" cy="17" rx={blink ? 4.5 : 4.5} ry={blink ? 0.8 : 5} fill="#0a0a20" />
            <ellipse cx="32" cy="17" rx={blink ? 4.5 : 4.5} ry={blink ? 0.8 : 5} fill="#0a0a20" />
            {/* Eye shine */}
            {!blink && <>
              <circle cx="18.5" cy="15.5" r="1.5" fill="rgba(180,180,255,0.8)" />
              <circle cx="30.5" cy="15.5" r="1.5" fill="rgba(180,180,255,0.8)" />
            </>}
            {/* Smile */}
            <path d="M20 26 Q26 30 32 26" stroke="rgba(180,180,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {/* Antennae */}
            <line x1="18" y1="4" x2="14" y2="-2" stroke="#7B7BFF" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="13.5" cy="-3" r="2" fill="#a0a0ff" style={{ filter: "drop-shadow(0 0 3px #7B7BFF)" }}/>
            <line x1="34" y1="4" x2="38" y2="-2" stroke="#7B7BFF" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="38.5" cy="-3" r="2" fill="#a0a0ff" style={{ filter: "drop-shadow(0 0 3px #7B7BFF)" }}/>
            {/* Arms reaching up */}
            <path d="M10 36 Q6 28 14 24" stroke="#5B5BD6" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M42 36 Q46 28 38 24" stroke="#5B5BD6" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Legs */}
            <path d="M18 54 Q16 60 14 62" stroke="#3b3b7a" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M34 54 Q36 60 38 62" stroke="#3b3b7a" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Lightning bolt — alien is holding/playing with it */}
        <div
          style={{
            position: "absolute",
            left: 58,
            top: "50%",
            transform: "translateY(-54%)",
            animation: "bolt-dance 2.2s ease-in-out infinite",
            filter: "drop-shadow(0 0 16px rgba(91,91,214,0.95)) drop-shadow(0 0 32px rgba(91,91,214,0.5))",
            zIndex: 3,
          }}
        >
          <svg width="44" height="60" viewBox="0 0 44 60" fill="none">
            <defs>
              <linearGradient id="bolt2" x1="22" y1="0" x2="22" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c0c0ff"/>
                <stop offset="45%" stopColor="#7B7BFF"/>
                <stop offset="100%" stopColor="#3b3b9e"/>
              </linearGradient>
            </defs>
            <path d="M28 2L4 34H20L16 58L40 24H24L28 2Z"
              fill="url(#bolt2)"
              stroke="rgba(200,200,255,0.5)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path d="M26 8L10 32H20L17 50L32 26H22L26 8Z"
              fill="rgba(220,220,255,0.22)"
            />
          </svg>
        </div>

        {/* Sparks from bolt */}
        {[0,1,2,3].map(i => (
          <div key={i} className="absolute rounded-full pointer-events-none" style={{
            width: i%2===0 ? 3 : 2,
            height: i%2===0 ? 3 : 2,
            background: i%2===0 ? "#a0a0ff" : "#ffffff",
            left: "50%", top: "50%",
            boxShadow: "0 0 4px #7B7BFF",
            animation: `spark${i} 1.6s ease-out infinite`,
            animationDelay: `${i * 0.38}s`,
          }}/>
        ))}

        {/* Mini floating stars */}
        {[
          { x: 18, y: 15, size: 2, delay: 0 },
          { x: 200, y: 20, size: 2.5, delay: 0.6 },
          { x: 220, y: 85, size: 2, delay: 1.1 },
          { x: 35, y: 90, size: 1.5, delay: 1.6 },
        ].map((s, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none" style={{
            width: s.size, height: s.size,
            background: "#9090d0",
            left: s.x, top: s.y,
            animation: "star-twinkle 2s ease-in-out infinite",
            animationDelay: `${s.delay}s`,
            opacity: 0.6,
          }}/>
        ))}
      </div>

      {/* ── Steps list ── */}
      <div className="flex flex-col gap-1.5">
        {STEPS.slice(0, Math.min(stepIdx + 1, STEPS.length)).map((step, i) => {
          const isDone = completedSteps.includes(i);
          const isCurrent = i === stepIdx;
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: isCurrent ? "rgba(91,91,214,0.12)" : "transparent",
                border: isCurrent ? "1px solid rgba(91,91,214,0.22)" : "1px solid transparent",
                animation: isCurrent ? "none" : undefined,
                opacity: isDone ? 0.55 : 1,
              }}
            >
              <div className="shrink-0" style={{ fontSize: 13 }}>
                {isDone ? "✅" : isCurrent ? (
                  <span style={{ animation: "icon-pulse 1s ease-in-out infinite", display: "inline-block" }}>
                    {step.icon}
                  </span>
                ) : step.icon}
              </div>
              <span className="text-xs flex-1" style={{
                color: isCurrent ? "#b0b0ff" : isDone ? "#5a5a80" : "#8888A8",
                fontWeight: isCurrent ? 500 : 400,
              }}>
                {step.label}
              </span>
              {isCurrent && (
                <div className="flex gap-0.5 shrink-0">
                  {[0,1,2].map(d => (
                    <div key={d} className="rounded-full" style={{
                      width: 3, height: 3,
                      background: "#7B7BFF",
                      animation: "dot-bounce 0.9s ease-in-out infinite",
                      animationDelay: `${d * 0.2}s`,
                    }}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Progress bar ── */}
      <div className="px-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#5B5BD6] font-medium tracking-widest uppercase">Progression</span>
          <span className="text-[10px] text-[#7B7BFF] font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 4, background: "rgba(91,91,214,0.15)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #4040b8, #7B7BFF, #a0a0ff)",
              boxShadow: "0 0 8px rgba(91,91,214,0.6)",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes alien-float {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          50%      { transform: translateY(-7px) rotate(2deg); }
        }
        @keyframes bolt-dance {
          0%,100% { transform: translateY(-54%) rotate(-4deg) scale(1); }
          50%      { transform: translateY(-62%) rotate(4deg) scale(1.08); }
        }
        @keyframes glow-pulse {
          0%,100% { opacity: 0.6; transform: scale(0.9); }
          50%      { opacity: 1; transform: scale(1.1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes icon-pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.25); }
        }
        @keyframes dot-bounce {
          0%,100% { transform: translateY(0); opacity: 0.4; }
          50%      { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes star-twinkle {
          0%,100% { opacity: 0.2; transform: scale(0.8); }
          50%      { opacity: 0.9; transform: scale(1.4); }
        }
        @keyframes spark0 {
          0%   { transform: translate(-50%,-50%); opacity:1; }
          100% { transform: translate(calc(-50% + 20px), calc(-50% - 20px)); opacity:0; }
        }
        @keyframes spark1 {
          0%   { transform: translate(-50%,-50%); opacity:1; }
          100% { transform: translate(calc(-50% - 18px), calc(-50% - 16px)); opacity:0; }
        }
        @keyframes spark2 {
          0%   { transform: translate(-50%,-50%); opacity:1; }
          100% { transform: translate(calc(-50% + 16px), calc(-50% + 18px)); opacity:0; }
        }
        @keyframes spark3 {
          0%   { transform: translate(-50%,-50%); opacity:1; }
          100% { transform: translate(calc(-50% - 14px), calc(-50% + 20px)); opacity:0; }
        }
      `}</style>
    </div>
  );
}
