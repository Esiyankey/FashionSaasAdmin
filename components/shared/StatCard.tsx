import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  format?: "currency" | "number";
  changePercent?: number;
  tone?: "default" | "warning";
  icon?: LucideIcon;
}

export function StatCard({ label, value, format = "number", changePercent, tone = "default", icon: Icon }: StatCardProps) {
  const formattedValue = format === "currency" ? formatCurrency(value) : formatNumber(value);
  const isPositive = (changePercent ?? 0) >= 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <span className={cn("text-2xl font-semibold tracking-tight", tone === "warning" && value > 0 && "text-warning")}>
          {formattedValue}
        </span>
        {changePercent !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isPositive ? "text-success" : "text-destructive"
            )}
          >
            {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {formatPercent(changePercent)}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
