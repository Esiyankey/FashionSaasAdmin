"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { useOrganizations } from "@/features/organizations/hooks/useOrganizations";
import { formatDate } from "@/utils/format";
import type { Organization } from "@/features/organizations/types";

export default function OrganizationsPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useOrganizations();

  const columns: DataTableColumn<Organization>[] = [
    {
      id: "name",
      header: "Organization",
      cell: (org) => (
        <div className="flex flex-col">
          <span className="font-medium">{org.name}</span>
          <span className="text-xs text-muted-foreground">/{org.slug}</span>
        </div>
      ),
    },
    {
      id: "admin",
      header: "Admin",
      cell: (org) =>
        org.admin ? (
          <div className="flex flex-col">
            <span>{org.admin.name}</span>
            <span className="text-xs text-muted-foreground">{org.admin.email}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No admin</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: (org) => (
        <StatusChip label={org.status === "ACTIVE" ? "Active" : "Suspended"} tone={org.status === "ACTIVE" ? "success" : "destructive"} />
      ),
    },
    {
      id: "products",
      header: "Products",
      cell: (org) => org.counts.products,
    },
    {
      id: "orders",
      header: "Orders",
      cell: (org) => org.counts.orders,
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (org) => formatDate(org.createdAt),
    },
  ];

  return (
    <PageContainer
      title="Organizations"
      description="Every fashion business using the platform."
      actions={
        <Button onClick={() => router.push("/organizations/new")}>
          <Plus />
          New organization
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={data ?? []}
        getRowId={(org) => org.id}
        isLoading={isLoading}
        error={isError ? true : undefined}
        onRetry={() => refetch()}
        onRowClick={(org) => router.push(`/organizations/${org.id}`)}
        emptyTitle="No organizations yet"
        emptyDescription="Create the first organization to get started."
      />
    </PageContainer>
  );
}
