import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "destructive" | "info" | "muted";

const toneStyles: Record<StatusTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-accent/15 text-accent-foreground",
  muted: "bg-muted text-muted-foreground",
};

interface StatusChipProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

export function StatusChip({ label, tone, className }: StatusChipProps) {
  return (
    <Badge variant="secondary" className={cn("capitalize", toneStyles[tone], className)}>
      {label}
    </Badge>
  );
}
