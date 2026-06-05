interface GradoLogoProps {
  size?: number;
  className?: string;
}

export function GradoLogo({ size = 32, className = "" }: GradoLogoProps) {
  const id = `grado-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3a3a9e" />
          <stop offset="100%" stopColor="#1a1a3e" />
        </linearGradient>
        <linearGradient id={`${id}-g`} x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#5B5BD6" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill={`url(#${id}-bg)`} />
      {/* Subtle inner glow border */}
      <rect width="40" height="40" rx="10" fill="none" stroke="#7B7BF6" strokeWidth="0.8" strokeOpacity="0.5" />
      {/* G letterform */}
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="22"
        fill={`url(#${id}-g)`}
        filter={`url(#${id}-glow)`}
      >
        G
      </text>
    </svg>
  );
}

export function GradoLogoIcon({ size = 28, className = "" }: GradoLogoProps) {
  return <GradoLogo size={size} className={className} />;
}
