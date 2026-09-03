"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatCard } from "@/components/shared/StatCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary";
import { RecentOrdersWidget } from "@/features/dashboard/components/RecentOrdersWidget";
import { SalesOverviewWidget } from "@/features/dashboard/components/SalesOverviewWidget";
import { QuickActionsWidget } from "@/features/dashboard/components/QuickActionsWidget";
import { usePlatformSummary } from "@/features/platform/hooks/usePlatformSummary";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/utils/format";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN") return <SuperAdminDashboard />;
  return <OrganizationAdminDashboard />;
}

function OrganizationAdminDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  return (
    <PageContainer
      title={user ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
      description="Here's how your store is performing."
    >
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <LoadingState rows={4} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.stats.map((stat) => (
              <StatCard key={stat.id} label={stat.label} value={stat.value} format={stat.format} changePercent={stat.changePercent} />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total products" value={data.totals.products} format="number" />
            <StatCard label="Total customers" value={data.totals.customers} format="number" />
            <StatCard label="Low stock products" value={data.totals.lowStock} format="number" tone={data.totals.lowStock > 0 ? "warning" : "default"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <RecentOrdersWidget orders={data.recentOrders} isLoading={isLoading} />
            <div className="flex flex-col gap-4">
              <SalesOverviewWidget orderStatusDistribution={data.orderStatusDistribution} topSellingProducts={data.topSellingProducts} />
              <QuickActionsWidget />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function SuperAdminDashboard() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = usePlatformSummary();

  return (
    <PageContainer title="Platform overview" description="Every organization on the Fashion SaaS platform.">
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <LoadingState rows={4} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Organizations" value={data.totals.organizations} format="number" />
            <StatCard label="Active organizations" value={data.totals.activeOrganizations} format="number" />
            <StatCard label="Suspended organizations" value={data.totals.suspendedOrganizations} format="number" tone={data.totals.suspendedOrganizations > 0 ? "warning" : "default"} />
            <StatCard label="Platform revenue" value={data.totals.revenue} format="currency" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Organization admins" value={data.totals.organizationAdmins} format="number" />
            <StatCard label="Total orders" value={data.totals.orders} format="number" />
            <StatCard label="Total customers" value={data.totals.customers} format="number" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recently created organizations</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentOrganizations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No organizations yet.</p>
              ) : (
                <div className="flex flex-col divide-y">
                  {data.recentOrganizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => router.push(`/organizations/${org.id}`)}
                      className="flex items-center justify-between py-3 text-left text-sm hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">/{org.slug}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusChip label={org.status === "ACTIVE" ? "Active" : "Suspended"} tone={org.status === "ACTIVE" ? "success" : "destructive"} />
                        <span className="text-xs text-muted-foreground">{formatDate(org.createdAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
