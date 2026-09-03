import { StatCard } from "@/components/shared/StatCard";
import { LoadingState } from "@/components/shared/LoadingState";
import type { ProductStats } from "../types";

interface ProductStatsWidgetsProps {
  stats?: ProductStats;
  isLoading: boolean;
}

export function ProductStatsWidgets({ stats, isLoading }: ProductStatsWidgetsProps) {
  if (isLoading || !stats) return <LoadingState rows={1} className="grid-cols-5" />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label="Total products" value={stats.total} />
      <StatCard label="Published" value={stats.published} />
      <StatCard label="Draft" value={stats.draft} />
      <StatCard label="Archived" value={stats.archived} />
      <StatCard label="Low stock" value={stats.lowStock} tone="warning" />
    </div>
  );
}
