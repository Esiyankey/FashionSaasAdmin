"use client";

import { use, useState } from "react";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusChip } from "@/components/shared/StatusChip";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { useUpdateOrderStatus } from "@/features/orders/hooks/useUpdateOrderStatus";
import { NEXT_ORDER_STATUSES, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/features/orders/status";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Order, OrderStatus, PaymentStatus } from "@/features/orders/types";

function formatAddress(address: Record<string, unknown>): string[] {
  const get = (key: string) => (typeof address[key] === "string" ? (address[key] as string) : "");
  const cityLine = [get("city"), get("state"), get("zipCode") || get("postalCode")].filter(Boolean).join(", ");
  return [get("street") || get("line1"), get("apartment") || get("line2"), cityLine, get("country")].filter(Boolean);
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const updateOrder = useUpdateOrderStatus(id);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  if (isLoading || !order) {
    return (
      <PageContainer title="Order">{isError ? <ErrorState onRetry={() => refetch()} /> : <LoadingState rows={6} />}</PageContainer>
    );
  }

  const money = (value: number) => formatCurrency(value, order.currency);
  const nextStatuses = NEXT_ORDER_STATUSES[order.status];

  return (
    <PageContainer
      title={order.orderNumber}
      description={`Placed ${formatDate(order.createdAt)} · ${order.paymentMethod.toUpperCase()}`}
      actions={<StatusChip label={ORDER_STATUS_LABEL[order.status]} tone={ORDER_STATUS_TONE[order.status]} />}
    >
      <ApiErrorAlert error={updateOrder.error} className="mb-4" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Fulfilment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {nextStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">This order is {ORDER_STATUS_LABEL[order.status].toLowerCase()}. No further changes.</p>
            ) : (
              nextStatuses.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === "CANCELLED" ? "destructive" : "default"}
                  disabled={updateOrder.isPending}
                  onClick={() => setPendingStatus(status)}
                >
                  {status === "CANCELLED" ? "Cancel order" : `Mark ${ORDER_STATUS_LABEL[status].toLowerCase()}`}
                </Button>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Payment status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select
              value={order.paymentStatus}
              onValueChange={(value) => updateOrder.mutate({ paymentStatus: value as PaymentStatus })}
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
            <p className="text-xs text-muted-foreground">No payment provider is connected; update this manually (e.g. cash on delivery).</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{money(order.total)}</CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3 text-sm">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="size-12 rounded object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.variantTitle, item.sku && `SKU ${item.sku}`].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {money(item.unitPrice)}
                      </p>
                    </div>
                    <span>{money(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t pt-4 text-sm">
                <Row label="Subtotal" value={money(order.subtotal)} />
                {order.discount > 0 && <Row label="Discount" value={`-${money(order.discount)}`} />}
                <Row label="Shipping" value={money(order.shippingCost)} />
                <Row label="Tax" value={money(order.tax)} />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">
                        {entry.fromStatus ? `${ORDER_STATUS_LABEL[entry.fromStatus]} → ` : ""}
                        {ORDER_STATUS_LABEL[entry.toStatus]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                        {entry.changedBy ? ` · ${entry.changedBy.name}` : ""}
                      </p>
                      {entry.note && <p className="text-muted-foreground">{entry.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p className="text-muted-foreground">{order.shippingAddress.email}</p>
              {order.shippingAddress.phone && <p className="text-muted-foreground">{order.shippingAddress.phone}</p>}
              <div className="pt-3">
                <p className="text-xs font-medium text-muted-foreground">Ship to</p>
                {formatAddress(order.shippingAddress.address).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              {order.customerNote && (
                <div className="pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Customer note</p>
                  <p>{order.customerNote}</p>
                </div>
              )}
              {order.cancelReason && (
                <div className="pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Cancellation reason</p>
                  <p>{order.cancelReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <TrackingCard key={`${order.trackingNumber}-${order.carrier}`} order={order} onSave={(input) => updateOrder.mutate(input)} isPending={updateOrder.isPending} />
          <NotesCard key={order.internalNotes ?? ""} order={order} onSave={(internalNotes) => updateOrder.mutate({ internalNotes })} isPending={updateOrder.isPending} />
        </div>
      </div>

      <StatusChangeDialog
        key={pendingStatus ?? "closed"}
        order={order}
        status={pendingStatus}
        isPending={updateOrder.isPending}
        onClose={() => setPendingStatus(null)}
        onConfirm={(input) =>
          updateOrder.mutate(input, {
            onSuccess: () => setPendingStatus(null),
          })
        }
      />
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TrackingCard({
  order,
  onSave,
  isPending,
}: {
  order: Order;
  onSave: (input: { trackingNumber: string | null; carrier: string | null }) => void;
  isPending: boolean;
}) {
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1.5">
          <Label htmlFor="carrier">Carrier</Label>
          <Input id="carrier" value={carrier} onChange={(event) => setCarrier(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tracking">Tracking number</Label>
          <Input id="tracking" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
        </div>
        {order.shippedAt && <p className="text-xs text-muted-foreground">Shipped {formatDate(order.shippedAt)}</p>}
        {order.deliveredAt && <p className="text-xs text-muted-foreground">Delivered {formatDate(order.deliveredAt)}</p>}
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => onSave({ carrier: carrier || null, trackingNumber: trackingNumber || null })}
        >
          Save shipment details
        </Button>
      </CardContent>
    </Card>
  );
}

function NotesCard({ order, onSave, isPending }: { order: Order; onSave: (notes: string | null) => void; isPending: boolean }) {
  const [notes, setNotes] = useState(order.internalNotes ?? "");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Only visible to admins" />
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => onSave(notes || null)}>
          Save notes
        </Button>
      </CardContent>
    </Card>
  );
}

function StatusChangeDialog({
  order,
  status,
  isPending,
  onClose,
  onConfirm,
}: {
  order: Order;
  status: OrderStatus | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (input: { status: OrderStatus; note?: string; cancelReason?: string; trackingNumber?: string | null; carrier?: string | null }) => void;
}) {
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  if (!status) return null;
  const isCancel = status === "CANCELLED";

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title={isCancel ? "Cancel order" : `Mark as ${ORDER_STATUS_LABEL[status].toLowerCase()}`}>
      <div className="flex flex-col gap-4">
        {isCancel ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason">Reason (required)</Label>
              <Textarea id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Reserved stock is returned to inventory.</p>
          </>
        ) : (
          <>
            {status === "SHIPPED" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ship-carrier">Carrier</Label>
                  <Input id="ship-carrier" value={carrier} onChange={(event) => setCarrier(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ship-tracking">Tracking number</Label>
                  <Input id="ship-tracking" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="status-note">Note (optional)</Label>
              <Input id="status-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </>
        )}
        <Button
          variant={isCancel ? "destructive" : "default"}
          disabled={isPending || (isCancel && !reason.trim())}
          onClick={() =>
            onConfirm(
              isCancel
                ? { status, cancelReason: reason.trim() }
                : {
                    status,
                    note: note.trim() || undefined,
                    ...(status === "SHIPPED" ? { carrier: carrier || null, trackingNumber: trackingNumber || null } : {}),
                  }
            )
          }
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
