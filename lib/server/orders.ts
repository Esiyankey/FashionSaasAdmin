import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api/errors";
import { ORDER_INCLUDE, serializeOrder } from "@/lib/api/serializers/order";
import type { OrderStatus, PaymentStatus, Prisma } from "@/lib/generated/prisma/client";

export interface ListOrdersParams {
  search?: string;
  status?: OrderStatus | "all";
  paymentStatus?: PaymentStatus | "all";
  page: number;
  pageSize: number;
}

export async function listOrdersForOrg(organizationId: string, params: ListOrdersParams) {
  const where: Prisma.OrderWhereInput = {
    organizationId,
    ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    ...(params.paymentStatus && params.paymentStatus !== "all" ? { paymentStatus: params.paymentStatus } : {}),
    ...(params.search
      ? {
          OR: [
            { orderNumber: { contains: params.search, mode: "insensitive" } },
            { shippingName: { contains: params.search, mode: "insensitive" } },
            { shippingEmail: { contains: params.search, mode: "insensitive" } },
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

  return { items: items.map(serializeOrder), total };
}

export async function getOrderForOrg(organizationId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, organizationId }, include: ORDER_INCLUDE });
  if (!order) throw notFound("Order not found");
  return serializeOrder(order);
}

export async function updateOrderStatusForOrg(
  organizationId: string,
  id: string,
  input: { status?: OrderStatus; paymentStatus?: PaymentStatus }
) {
  const existing = await prisma.order.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!existing) throw notFound("Order not found");
  const order = await prisma.order.update({
    where: { id },
    data: { status: input.status, paymentStatus: input.paymentStatus },
    include: ORDER_INCLUDE,
  });
  return serializeOrder(order);
}
