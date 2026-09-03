import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "@/lib/api/errors";
import { ORDER_INCLUDE, serializeOrder } from "@/lib/api/serializers/order";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface ListCustomersParams {
  search?: string;
  page: number;
  pageSize: number;
}

function summarizeOrders(orders: { total: number; createdAt: Date }[]) {
  const orderCount = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const lastOrderAt = orders.reduce<Date | null>(
    (latest, order) => (!latest || order.createdAt > latest ? order.createdAt : latest),
    null
  );
  return { orderCount, totalSpent, lastOrderAt: lastOrderAt ? lastOrderAt.toISOString() : null };
}

export async function listCustomersForOrg(organizationId: string, params: ListCustomersParams) {
  const where: Prisma.CustomerWhereInput = {
    organizationId,
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { orders: { select: { total: true, createdAt: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  const items = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    createdAt: customer.createdAt.toISOString(),
    ...summarizeOrders(customer.orders),
  }));

  return { items, total };
}

export async function getCustomerDetailForOrg(organizationId: string, id: string) {
  const customer = await prisma.customer.findFirst({
    where: { id, organizationId },
    include: { orders: { orderBy: { createdAt: "desc" }, include: ORDER_INCLUDE } },
  });
  if (!customer) throw notFound("Customer not found");

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    createdAt: customer.createdAt.toISOString(),
    ...summarizeOrders(customer.orders),
    orders: customer.orders.map(serializeOrder),
  };
}
