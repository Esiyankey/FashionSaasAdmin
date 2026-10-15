import type { Prisma } from "@/lib/generated/prisma/client";

export const ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  items: true,
  statusHistory: {
    orderBy: { createdAt: "asc" },
    include: { changedBy: { select: { id: true, name: true } } },
  },
} satisfies Prisma.OrderInclude;

type DbOrder = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

/** Admin representation of an order (includes internal notes and history). */
export function serializeOrder(order: DbOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    customer: order.customer,
    shippingAddress: {
      name: order.shippingName,
      email: order.shippingEmail,
      phone: order.shippingPhone,
      address: order.shippingAddress,
    },
    billingAddress: order.billingAddress,
    customerNote: order.customerNote,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productSlug: item.productSlug,
      variantId: item.variantId,
      productName: item.productName,
      variantTitle: item.variantTitle,
      sku: item.sku,
      size: item.size,
      color: item.color,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      compareAtPrice: item.compareAtPrice,
      discount: item.discount,
      total: item.total,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCost: order.shipping,
    tax: order.tax,
    total: order.total,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    cancelReason: order.cancelReason,
    internalNotes: order.internalNotes,
    statusHistory: order.statusHistory.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      note: entry.note,
      changedBy: entry.changedBy,
      createdAt: entry.createdAt.toISOString(),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export type SerializedOrder = ReturnType<typeof serializeOrder>;
