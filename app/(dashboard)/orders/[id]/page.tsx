"use client";

import { use } from "react";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusChip } from "@/components/shared/StatusChip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { useUpdateOrderStatus } from "@/features/orders/hooks/useUpdateOrderStatus";
import { formatCurrency, formatDate } from "@/utils/format";
import type { OrderStatus, PaymentStatus } from "@/features/orders/types";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const updateStatus = useUpdateOrderStatus(id);

  if (isLoading || !order) {
    return (
      <PageContainer title="Order">{isError ? <ErrorState onRetry={() => refetch()} /> : <LoadingState rows={6} />}</PageContainer>
    );
  }

  return (
    <PageContainer title={order.orderNumber} description={`Placed ${formatDate(order.createdAt)}`}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Order status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={order.status}
              onValueChange={(value) => updateStatus.mutate({ status: value as OrderStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Payment status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={order.paymentStatus}
              onValueChange={(value) => updateStatus.mutate({ paymentStatus: value as PaymentStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(order.total)}</CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    {item.variantTitle && <p className="text-xs text-muted-foreground">{item.variantTitle}</p>}
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <span>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-muted-foreground">{order.customer.email}</p>
            {order.customer.phone && <p className="text-muted-foreground">{order.customer.phone}</p>}
            <div className="pt-3">
              <p className="text-xs font-medium text-muted-foreground">Shipping address</p>
              <p>{JSON.stringify(order.shippingAddress.address)}</p>
            </div>
            <div className="pt-2">
              <StatusChip label={order.status} tone={order.status === "FULFILLED" ? "success" : "muted"} />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
