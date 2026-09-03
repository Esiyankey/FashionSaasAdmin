import "server-only";
import { prisma } from "@/lib/db";

function pctChange(prev: number, curr: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export async function getDashboardSummaryForOrg(organizationId: string) {
  const now = new Date();
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const start60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    ordersLast30,
    ordersPrev30,
    totalProducts,
    totalCustomers,
    lowStockRows,
    recentOrders,
    newCustomers30,
    newCustomersPrev30,
    statusGroups,
    topItems,
  ] = await Promise.all([
    prisma.order.findMany({ where: { organizationId, createdAt: { gte: start30 } }, select: { total: true } }),
    prisma.order.findMany({
      where: { organizationId, createdAt: { gte: start60, lt: start30 } },
      select: { total: true },
    }),
    prisma.product.count({ where: { organizationId } }),
    prisma.customer.count({ where: { organizationId } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "products"
      WHERE "organizationId" = ${organizationId} AND "trackQuantity" = true AND "quantity" <= "lowStockThreshold"
    `,
    prisma.order.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.customer.count({ where: { organizationId, createdAt: { gte: start30 } } }),
    prisma.customer.count({ where: { organizationId, createdAt: { gte: start60, lt: start30 } } }),
    prisma.order.groupBy({ by: ["status"], where: { organizationId }, _count: { _all: true } }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { organizationId }, productId: { not: null } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const revenue30 = ordersLast30.reduce((sum, o) => sum + o.total, 0);
  const revenuePrev30 = ordersPrev30.reduce((sum, o) => sum + o.total, 0);
  const orderCount30 = ordersLast30.length;
  const orderCountPrev30 = ordersPrev30.length;
  const aov30 = orderCount30 ? revenue30 / orderCount30 : 0;
  const aovPrev30 = orderCountPrev30 ? revenuePrev30 / orderCountPrev30 : 0;

  return {
    stats: [
      { id: "revenue", label: "Revenue (30d)", value: revenue30, format: "currency", changePercent: pctChange(revenuePrev30, revenue30) },
      { id: "orders", label: "Orders (30d)", value: orderCount30, format: "number", changePercent: pctChange(orderCountPrev30, orderCount30) },
      { id: "customers", label: "New customers (30d)", value: newCustomers30, format: "number", changePercent: pctChange(newCustomersPrev30, newCustomers30) },
      { id: "aov", label: "Avg. order value", value: Math.round(aov30 * 100) / 100, format: "currency", changePercent: pctChange(aovPrev30, aov30) },
    ],
    totals: { products: totalProducts, customers: totalCustomers, lowStock: Number(lowStockRows[0]?.count ?? 0) },
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    })),
    orderStatusDistribution: statusGroups.map((group) => ({ status: group.status, count: group._count._all })),
    topSellingProducts: topItems.map((item) => ({
      productId: item.productId as string,
      title: item.productName,
      quantitySold: item._sum.quantity ?? 0,
      revenue: item._sum.total ?? 0,
    })),
  };
}
