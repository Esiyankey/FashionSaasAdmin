import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip, type StatusTone } from "@/components/shared/StatusChip";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { OrderStatusDistributionEntry, RecentOrderStatus, TopSellingProduct } from "../types";

const statusTones: Record<RecentOrderStatus, StatusTone> = {
  FULFILLED: "success",
  PROCESSING: "info",
  PENDING: "warning",
  CANCELLED: "destructive",
};

interface SalesOverviewWidgetProps {
  orderStatusDistribution: OrderStatusDistributionEntry[];
  topSellingProducts: TopSellingProduct[];
}

export function SalesOverviewWidget({ orderStatusDistribution, topSellingProducts }: SalesOverviewWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {orderStatusDistribution.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          orderStatusDistribution.map((entry) => (
            <div key={entry.status} className="flex items-center justify-between text-sm">
              <StatusChip label={entry.status} tone={statusTones[entry.status]} />
              <span className="font-medium">{formatNumber(entry.count)}</span>
            </div>
          ))
        )}

        {topSellingProducts.length > 0 && (
          <div className="mt-2 border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Top sellers</p>
            <div className="flex flex-col gap-1.5">
              {topSellingProducts.map((product) => (
                <div key={product.productId} className="flex items-center justify-between text-sm">
                  <span className="truncate">{product.title}</span>
                  <span className="text-muted-foreground">{formatCurrency(product.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
