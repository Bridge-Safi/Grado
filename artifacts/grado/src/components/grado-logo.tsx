import logoImg from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface GradoLogoProps {
  size?: number;
  className?: string;
}

export function GradoLogo({ size = 32, className = "" }: GradoLogoProps) {
  return (
    <img
      src={logoImg}
      alt="Grado"
      style={{ width: size, height: size }}
      className={cn("object-contain", className)}
    />
  );
}

export function GradoLogoIcon({ size = 28, className = "" }: GradoLogoProps) {
  return <GradoLogo size={size} className={className} />;
}
