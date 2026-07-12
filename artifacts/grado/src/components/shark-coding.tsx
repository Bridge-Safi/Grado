import { useEffect, useState } from "react";
import { GradoLogo } from "./grado-logo";

export function AgentAvatar({ size = 20, boxSize = 28 }: { size?: number; boxSize?: number }) {
  return (
    <div
      className="relative shrink-0 mr-2 mt-1"
      style={{ width: boxSize, height: boxSize }}
    >
      {/* rotating aura ring */}
      <div
        className="absolute inset-[-3px] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, #5B5BD6, #7B7BFF, transparent 40%, transparent 60%, #5B5BD6)",
          animation: "agent-spin 2.2s linear infinite",
          filter: "blur(2px)",
          opacity: 0.85,
        }}
      />
      {/* breathing glow */}
      <div
        className="absolute inset-[-6px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(123,123,255,0.35), transparent 70%)",
          animation: "agent-breathe 1.8s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 rounded-full bg-[#0e0e16] border border-[#5B5BD6]/40 flex items-center justify-center">
        <GradoLogo size={size} />
      </div>
      <style>{`
        @keyframes agent-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes agent-breathe { 0%, 100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 0.75; transform: scale(1.15); } }
      `}</style>
    </div>
  );
}

const BUILD_STEPS = [
  { icon: "🧠", label: "Analyse de ta demande..." },
  { icon: "🏗️", label: "Conception de l'architecture..." },
  { icon: "⚙️", label: "Génération du code..." },
  { icon: "🎨", label: "Application du design..." },
  { icon: "✨", label: "Optimisation..." },
  { icon: "🚀", label: "Finalisation..." },
];

export function SharkCoding({ isBuilding = true }: { isBuilding?: boolean }) {
  if (!isBuilding) {
    return <ThinkingDots />;
  }
  return <BuildingLoader />;
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2.5 py-0.5 px-1">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "linear-gradient(135deg, #7B7BFF, #5B5BD6)",
              boxShadow: "0 0 6px rgba(123,123,255,0.7)",
              animation: "thinking-wave 1.1s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <span
        className="text-[11px] font-medium tracking-wide"
        style={{
          background: "linear-gradient(90deg, #8888A8, #b0b0ff, #8888A8)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "shimmer-text 2s linear infinite",
        }}
      >
        Grado réfléchit...
      </span>
      <style>{`
        @keyframes thinking-wave {
          0%, 60%, 100% { transform: translateY(0) scale(0.75); opacity: 0.5; }
          30% { transform: translateY(-4px) scale(1); opacity: 1; }
        }
        @keyframes shimmer-text {
          0% { background-position: 0% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}

function BuildingLoader() {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(5);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx((prev) => {
        const next = Math.min(prev + 1, BUILD_STEPS.length - 1);
        setCompletedSteps((c) => (c.includes(prev) ? c : [...c, prev]));
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 5, 93));
    }, 450);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-2.5" style={{ width: 220 }}>
      {/* Steps */}
      <div className="flex flex-col gap-1">
        {BUILD_STEPS.slice(0, Math.min(stepIdx + 1, BUILD_STEPS.length)).map((step, i) => {
          const isDone = completedSteps.includes(i);
          const isCurrent = i === stepIdx;
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: isCurrent ? "rgba(91,91,214,0.1)" : "transparent",
                border: isCurrent ? "1px solid rgba(91,91,214,0.18)" : "1px solid transparent",
                opacity: isDone ? 0.45 : 1,
              }}
            >
              <span className="text-sm shrink-0">
                {isDone ? "✅" : isCurrent ? (
                  <span style={{ display: "inline-block", animation: "pulse-icon 1s ease-in-out infinite" }}>
                    {step.icon}
                  </span>
                ) : step.icon}
              </span>
              <span
                className="text-xs flex-1 truncate"
                style={{ color: isCurrent ? "#b0b0ff" : isDone ? "#4a4a6a" : "#8888A8", fontWeight: isCurrent ? 500 : 400 }}
              >
                {step.label}
              </span>
              {isCurrent && (
                <div className="flex gap-0.5 shrink-0">
                  {[0, 1, 2].map((d) => (
                    <div key={d} className="rounded-full" style={{
                      width: 2.5, height: 2.5,
                      background: "#7B7BFF",
                      animation: "dot-b 0.9s ease-in-out infinite",
                      animationDelay: `${d * 0.2}s`,
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-[#5B5BD6] font-medium tracking-widest uppercase">Progression</span>
          <span className="text-[10px] text-[#7B7BFF] font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 3, background: "rgba(91,91,214,0.12)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #4040b8, #7B7BFF)",
              boxShadow: "0 0 6px rgba(91,91,214,0.5)",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse-icon { 0%,100%{transform:scale(1)}50%{transform:scale(1.2)} }
        @keyframes dot-b { 0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-2px);opacity:1} }
      `}</style>
    </div>
  );
}
