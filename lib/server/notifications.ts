import "server-only";
import { prisma } from "@/lib/db";

export async function getNotificationsForOrg(organizationId: string) {
  const [products, pendingOrders] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId, trackQuantity: true },
      select: { id: true, title: true, quantity: true, lowStockThreshold: true, updatedAt: true },
    }),
    prisma.order.findMany({
      where: { organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, orderNumber: true, createdAt: true },
    }),
  ]);

  const lowStock = products.filter((product) => product.quantity <= product.lowStockThreshold);

  const notifications = [
    ...lowStock.map((product) => ({
      id: `low-stock-${product.id}`,
      title: "Low stock",
      description: `${product.title} has ${product.quantity} left (threshold ${product.lowStockThreshold}).`,
      createdAt: product.updatedAt.toISOString(),
      isRead: false,
    })),
    ...pendingOrders.map((order) => ({
      id: `order-${order.id}`,
      title: "New order",
      description: `Order ${order.orderNumber} is awaiting processing.`,
      createdAt: order.createdAt.toISOString(),
      isRead: false,
    })),
  ];

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return notifications.slice(0, 20);
}
