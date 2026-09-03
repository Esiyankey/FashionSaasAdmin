import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_NATURAL_WIDTH = 559;
const LOGO_NATURAL_HEIGHT = 446;

const sizeClasses = {
  sm: "h-7",
  md: "h-9",
  lg: "h-14",
} as const;

interface LogoProps {
  size?: keyof typeof sizeClasses;
  className?: string;
  priority?: boolean;
}

export function Logo({ size = "md", className, priority }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Fashion SaaS"
      width={LOGO_NATURAL_WIDTH}
      height={LOGO_NATURAL_HEIGHT}
      priority={priority}
      className={cn("w-auto object-contain", sizeClasses[size], className)}
    />
  );
}
