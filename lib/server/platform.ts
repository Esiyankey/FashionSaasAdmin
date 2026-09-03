import "server-only";
import { prisma } from "@/lib/db";

export async function getPlatformSummary() {
  const [
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    totalOrgAdmins,
    totalOrders,
    totalCustomers,
    revenueAgg,
    recentOrganizations,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "ACTIVE" } }),
    prisma.organization.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: "ORGANIZATION_ADMIN" } }),
    prisma.order.count(),
    prisma.customer.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, status: true, createdAt: true },
    }),
  ]);

  return {
    totals: {
      organizations: totalOrganizations,
      activeOrganizations,
      suspendedOrganizations,
      organizationAdmins: totalOrgAdmins,
      orders: totalOrders,
      customers: totalCustomers,
      revenue: revenueAgg._sum.total ?? 0,
    },
    recentOrganizations: recentOrganizations.map((org) => ({ ...org, createdAt: org.createdAt.toISOString() })),
  };
}
