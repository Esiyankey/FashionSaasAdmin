import type { Prisma } from "@/lib/generated/prisma/client";

export const ORDER_INCLUDE = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  items: true,
} satisfies Prisma.OrderInclude;

type DbOrder = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

export function serializeOrder(order: DbOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    customer: order.customer,
    shippingAddress: {
      name: order.shippingName,
      email: order.shippingEmail,
      phone: order.shippingPhone,
      address: order.shippingAddress,
    },
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      variantTitle: item.variantTitle,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCost: order.shipping,
    tax: order.tax,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export type SerializedOrder = ReturnType<typeof serializeOrder>;
