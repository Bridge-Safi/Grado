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
        <linearGradient id="bolt-grad" x1="10" y1="2" x2="22" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFF" />
          <stop offset="100%" stopColor="#5B5BD6" />
        </linearGradient>
      </defs>
      {/* Lightning bolt */}
      <path
        d="M18.5 3L9 17.5H15.5L13.5 29L23 14.5H16.5L18.5 3Z"
        fill="url(#bolt-grad)"
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
