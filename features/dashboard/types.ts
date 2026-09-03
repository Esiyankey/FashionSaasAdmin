export interface DashboardStat {
  id: string;
  label: string;
  value: number;
  format: "currency" | "number";
  changePercent: number;
}

export type RecentOrderStatus = "PENDING" | "PROCESSING" | "FULFILLED" | "CANCELLED";

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: RecentOrderStatus;
  createdAt: string;
}

export interface OrderStatusDistributionEntry {
  status: RecentOrderStatus;
  count: number;
}

export interface TopSellingProduct {
  productId: string;
  title: string;
  quantitySold: number;
  revenue: number;
}

export interface DashboardTotals {
  products: number;
  customers: number;
  lowStock: number;
}

export interface DashboardSummary {
  stats: DashboardStat[];
  totals: DashboardTotals;
  recentOrders: RecentOrderSummary[];
  orderStatusDistribution: OrderStatusDistributionEntry[];
  topSellingProducts: TopSellingProduct[];
}
