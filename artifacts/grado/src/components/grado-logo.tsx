import { cn } from "@/lib/utils";

interface GradoLogoProps {
  size?: number;
  className?: string;
}

export function GradoLogo({ size = 32, className = "" }: GradoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      <defs>
        <radialGradient id="bolt-shine" cx="42%" cy="46%" r="70%">
          <stop offset="0%" stopColor="#F0EBFF" />
          <stop offset="30%" stopColor="#C4AFFF" />
          <stop offset="65%" stopColor="#8B6FF0" />
          <stop offset="100%" stopColor="#5B21B6" />
        </radialGradient>
      </defs>
      {/* Top wing of the bolt */}
      <path
        d="M18 2 L29 15.5 L16.5 15.5 L12 2 Z"
        fill="url(#bolt-shine)"
      />
      {/* Bottom wing of the bolt */}
      <path
        d="M14 30 L3 16.5 L15.5 16.5 L20 30 Z"
        fill="url(#bolt-shine)"
      />
    </svg>
  );
}

export function GradoLogoIcon({ size = 28, className = "" }: GradoLogoProps) {
  return <GradoLogo size={size} className={className} />;
}

interface GradoWordmarkProps {
  size?: number;
  className?: string;
}

export function GradoWordmark({ size = 28, className = "" }: GradoWordmarkProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <GradoLogo size={size} />
      <span
        style={{ fontSize: size * 0.55, fontWeight: 700, letterSpacing: "-0.02em" }}
        className="text-white"
      >
        Grado
      </span>
    </div>
  );
}
