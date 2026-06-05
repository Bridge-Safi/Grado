export function SharkCoding() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 select-none">
      <div className="relative flex items-center justify-center" style={{ width: 110, height: 110 }}>

        {/* Outer pulsing ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(91,91,214,0.18) 0%, transparent 70%)",
            animation: "pulse-ring 2s ease-in-out infinite",
          }}
        />

        {/* Mid glow ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 80,
            height: 80,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(91,91,214,0.25) 0%, transparent 70%)",
            animation: "pulse-ring 2s ease-in-out infinite 0.4s",
          }}
        />

        {/* Rotating orbit dots */}
        <div
          className="absolute"
          style={{
            width: 96,
            height: 96,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "orbit 3s linear infinite",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "#7B7BFF",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: "0 0 8px #5B5BD6",
            }}
          />
        </div>
        <div
          className="absolute"
          style={{
            width: 96,
            height: 96,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "orbit 3s linear infinite 1.5s",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: 4,
              height: 4,
              background: "#a0a0ff",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: "0 0 6px #8080e8",
            }}
          />
        </div>

        {/* Central lightning bolt */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            animation: "bolt-pulse 1.6s ease-in-out infinite",
            filter: "drop-shadow(0 0 14px rgba(91,91,214,0.9)) drop-shadow(0 0 28px rgba(91,91,214,0.5))",
          }}
        >
          <svg width="42" height="58" viewBox="0 0 42 58" fill="none">
            {/* Glow layer */}
            <path
              d="M26 2L4 32H20L16 56L38 24H22L26 2Z"
              fill="rgba(91,91,214,0.3)"
              strokeWidth="0"
            />
            {/* Main bolt — gradient fill */}
            <defs>
              <linearGradient id="bolt-grad" x1="21" y1="2" x2="21" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a0a0ff" />
                <stop offset="50%" stopColor="#5B5BD6" />
                <stop offset="100%" stopColor="#3b3b9e" />
              </linearGradient>
            </defs>
            <path
              d="M26 2L4 32H20L16 56L38 24H22L26 2Z"
              fill="url(#bolt-grad)"
              stroke="rgba(180,180,255,0.6)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* Inner highlight */}
            <path
              d="M24 8L10 30H20L17 48L30 28H21L24 8Z"
              fill="rgba(200,200,255,0.25)"
            />
          </svg>
        </div>

        {/* Spark particles */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 2 === 0 ? 3 : 2,
              height: i % 2 === 0 ? 3 : 2,
              background: i % 2 === 0 ? "#7B7BFF" : "#c0c0ff",
              boxShadow: "0 0 4px #5B5BD6",
              top: "50%",
              left: "50%",
              animation: `spark-${i} 1.6s ease-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Pulse bar */}
      <div
        className="rounded-full overflow-hidden"
        style={{ width: 80, height: 3, background: "rgba(91,91,214,0.15)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, #5B5BD6, #7B7BFF, transparent)",
            animation: "slide-bar 1.4s ease-in-out infinite",
          }}
        />
      </div>

      <p
        className="text-xs tracking-widest uppercase"
        style={{
          color: "#7B7BFF",
          animation: "text-fade 1.6s ease-in-out infinite",
          letterSpacing: "0.18em",
        }}
      >
        Grado construit...
      </p>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(0.9); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes orbit {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes bolt-pulse {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 10px rgba(91,91,214,0.8)) drop-shadow(0 0 22px rgba(91,91,214,0.4)); }
          50%       { transform: scale(1.12); filter: drop-shadow(0 0 20px rgba(120,120,255,1))  drop-shadow(0 0 40px rgba(91,91,214,0.7)); }
        }
        @keyframes slide-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes text-fade {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes spark-0 {
          0%   { transform: translate(-50%,-50%) translate(0px, 0px); opacity: 1; }
          100% { transform: translate(-50%,-50%) translate(-22px,-22px); opacity: 0; }
        }
        @keyframes spark-1 {
          0%   { transform: translate(-50%,-50%) translate(0px, 0px); opacity: 1; }
          100% { transform: translate(-50%,-50%) translate(24px,-18px); opacity: 0; }
        }
        @keyframes spark-2 {
          0%   { transform: translate(-50%,-50%) translate(0px, 0px); opacity: 1; }
          100% { transform: translate(-50%,-50%) translate(-20px, 24px); opacity: 0; }
        }
        @keyframes spark-3 {
          0%   { transform: translate(-50%,-50%) translate(0px, 0px); opacity: 1; }
          100% { transform: translate(-50%,-50%) translate(20px, 22px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
