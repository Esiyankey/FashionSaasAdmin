import "server-only";
import { prisma } from "@/lib/db";
import { conflict, notFound, validationError } from "@/lib/api/errors";
import { paginated } from "@/lib/api/handler";
import { ORDER_INCLUDE, serializeOrder } from "@/lib/api/serializers/order";
import { notifyStorefront, StorefrontTag } from "@/lib/server/revalidate";
import type { OrderStatus, PaymentStatus, Prisma } from "@/lib/generated/prisma/client";

/**
 * Allowed fulfilment transitions. Anything else is rejected with 409.
 * Cancelling returns reserved stock to inventory.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export interface ListOrdersParams {
  search?: string;
  status?: OrderStatus | "all";
  paymentStatus?: PaymentStatus | "all";
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export async function listOrdersForOrg(organizationId: string, params: ListOrdersParams) {
  const where: Prisma.OrderWhereInput = {
    organizationId,
    ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    ...(params.paymentStatus && params.paymentStatus !== "all" ? { paymentStatus: params.paymentStatus } : {}),
    ...(params.from || params.to
      ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
      : {}),
    ...(params.search
      ? {
          OR: [
            { orderNumber: { contains: params.search, mode: "insensitive" } },
            { shippingName: { contains: params.search, mode: "insensitive" } },
            { shippingEmail: { contains: params.search, mode: "insensitive" } },
            { shippingPhone: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return paginated(items.map(serializeOrder), total, params);
}

export async function getOrderForOrg(organizationId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, organizationId }, include: ORDER_INCLUDE });
  if (!order) throw notFound("Order not found");
  return serializeOrder(order);
}

/** Returns each line's quantity to the variant (or product) it was taken from. */
export async function restockOrderItems(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { quantity: true, variantId: true, productId: true, product: { select: { trackQuantity: true } } },
  });
  for (const item of items) {
    if (!item.product?.trackQuantity) continue;
    if (item.variantId) {
      await tx.productVariant.updateMany({
        where: { id: item.variantId },
        data: { inventoryQuantity: { increment: item.quantity } },
      });
    } else if (item.productId) {
      await tx.product.updateMany({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } });
    }
  }
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  note?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  cancelReason?: string;
  internalNotes?: string | null;
}

export async function updateOrderForOrg(organizationId: string, id: string, userId: string, input: UpdateOrderInput) {
  const existing = await prisma.order.findFirst({ where: { id, organizationId } });
  if (!existing) throw notFound("Order not found");

  const statusChange = input.status && input.status !== existing.status ? input.status : undefined;
  if (statusChange && !ORDER_TRANSITIONS[existing.status].includes(statusChange)) {
    const allowed = ORDER_TRANSITIONS[existing.status];
    throw conflict(
      `Cannot change an order from ${existing.status} to ${statusChange}.` +
        (allowed.length ? ` Allowed: ${allowed.join(", ")}.` : " This order is final."),
      "INVALID_STATUS_TRANSITION"
    );
  }
  if (statusChange === "CANCELLED" && !input.cancelReason?.trim()) {
    throw validationError({ cancelReason: ["A reason is required to cancel an order"] });
  }

  const now = new Date();
  const order = await prisma.$transaction(async (tx) => {
    if (statusChange) {
      // Guard against a concurrent change between the read above and this write.
      const result = await tx.order.updateMany({
        where: { id, status: existing.status },
        data: {
          status: statusChange,
          ...(statusChange === "SHIPPED" ? { shippedAt: now } : {}),
          ...(statusChange === "DELIVERED" ? { deliveredAt: now } : {}),
          ...(statusChange === "CANCELLED" ? { cancelledAt: now, cancelReason: input.cancelReason?.trim() } : {}),
        },
      });
      if (result.count === 0) throw conflict("The order was changed by someone else. Reload and try again.");
      if (statusChange === "CANCELLED") await restockOrderItems(tx, id);
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: existing.status,
          toStatus: statusChange,
          note: input.note?.trim() || (statusChange === "CANCELLED" ? input.cancelReason?.trim() : undefined) || null,
          changedById: userId,
        },
      });
    }
    return tx.order.update({
      where: { id },
      data: {
        ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
        ...(input.trackingNumber !== undefined ? { trackingNumber: input.trackingNumber?.trim() || null } : {}),
        ...(input.carrier !== undefined ? { carrier: input.carrier?.trim() || null } : {}),
        ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes?.trim() || null } : {}),
      },
      include: ORDER_INCLUDE,
    });
  });

  if (statusChange === "CANCELLED") notifyStorefront(organizationId, [StorefrontTag.products]);
  return serializeOrder(order);
}
