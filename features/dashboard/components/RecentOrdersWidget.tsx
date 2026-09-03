import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusChip, type StatusTone } from "@/components/shared/StatusChip";
import { formatCurrency, formatRelativeTime } from "@/utils/format";
import type { RecentOrderStatus, RecentOrderSummary } from "../types";

const statusTones: Record<RecentOrderStatus, StatusTone> = {
  FULFILLED: "success",
  PROCESSING: "info",
  PENDING: "warning",
  CANCELLED: "destructive",
};

const columns: DataTableColumn<RecentOrderSummary>[] = [
  { id: "orderNumber", header: "Order", cell: (row) => <span className="font-medium">{row.orderNumber}</span> },
  { id: "customer", header: "Customer", cell: (row) => row.customerName },
  { id: "total", header: "Total", cell: (row) => formatCurrency(row.total) },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusChip label={row.status} tone={statusTones[row.status]} />,
  },
  { id: "createdAt", header: "Placed", cell: (row) => formatRelativeTime(row.createdAt) },
];

interface RecentOrdersWidgetProps {
  orders: RecentOrderSummary[];
  isLoading: boolean;
}

export function RecentOrdersWidget({ orders, isLoading }: RecentOrdersWidgetProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={orders}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No orders yet"
          emptyDescription="Orders will show up here once your storefront starts selling."
        />
      </CardContent>
    </Card>
  );
}
