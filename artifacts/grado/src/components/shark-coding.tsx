export function SharkCoding() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div className="relative">
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: "drop-shadow(0 0 12px rgba(91,91,214,0.35))" }}
        >
          {/* Body */}
          <ellipse cx="44" cy="54" rx="30" ry="18" fill="#5B5BD6" />
          {/* Belly */}
          <ellipse cx="44" cy="58" rx="20" ry="10" fill="#8080e8" opacity="0.5" />
          {/* Tail fin */}
          <path d="M74 54 L92 42 L90 58 L92 72 L74 62 Z" fill="#4a4ab8" />
          {/* Top fin */}
          <path d="M44 36 L52 20 L56 36 Z" fill="#4a4ab8" />
          {/* Side fin */}
          <path d="M36 62 L24 74 L30 62 Z" fill="#4a4ab8" />
          {/* Eye */}
          <circle cx="24" cy="50" r="4" fill="white" />
          <circle cx="23" cy="50" r="2" fill="#1a1a2e" />
          {/* Mouth / smile */}
          <path d="M14 56 Q18 62 24 58" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Teeth */}
          <path d="M15 57 L16 60 L17 57" fill="white" />
          <path d="M18 59 L19 63 L20 59" fill="white" />
          {/* Glasses */}
          <rect x="19" y="46" width="8" height="5" rx="2" fill="none" stroke="#1a1a2e" strokeWidth="1.2" />
          <line x1="27" y1="48.5" x2="30" y2="48.5" stroke="#1a1a2e" strokeWidth="1.2" />
          <circle cx="21.5" cy="48.5" r="2" fill="#5B5BD6" opacity="0.4" />
        </svg>

        {/* Animated keyboard below shark */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2"
          style={{ width: 56 }}
        >
          <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
            <rect x="0" y="4" width="56" height="16" rx="3" fill="#18181f" stroke="#2a2a38" strokeWidth="1" />
            {/* Keys */}
            {[4, 10, 16, 22, 28, 34, 40, 46].map((x, i) => (
              <rect
                key={i}
                x={x}
                y="8"
                width="5"
                height="4"
                rx="1"
                fill="#2a2a38"
                style={{
                  animation: `keypress 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
            {/* Space bar */}
            <rect x="12" y="14" width="32" height="4" rx="1" fill="#2a2a38" />
          </svg>
        </div>
      </div>

      {/* Typing dots */}
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className="w-1.5 h-1.5 rounded-full bg-primary/70"
          style={{ animation: "bounce 1s ease-in-out infinite", animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-primary/70"
          style={{ animation: "bounce 1s ease-in-out infinite", animationDelay: "200ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-primary/70"
          style={{ animation: "bounce 1s ease-in-out infinite", animationDelay: "400ms" }}
        />
      </div>

      <p className="text-xs text-muted-foreground tracking-wide">
        Building your project...
      </p>

      <style>{`
        @keyframes keypress {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(1px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
