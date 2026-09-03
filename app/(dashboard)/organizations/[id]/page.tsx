"use client";

import { use, useState } from "react";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusChip } from "@/components/shared/StatusChip";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/features/organizations/hooks/useOrganization";
import { useSetOrganizationStatus } from "@/features/organizations/hooks/useSetOrganizationStatus";
import { formatDate, formatNumber } from "@/utils/format";

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: organization, isLoading, isError, refetch } = useOrganization(id);
  const setStatus = useSetOrganizationStatus(id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !organization) {
    return (
      <PageContainer title="Organization">
        {isError ? <ErrorState onRetry={() => refetch()} /> : <LoadingState rows={6} />}
      </PageContainer>
    );
  }

  const nextStatus = organization.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  return (
    <PageContainer
      title={organization.name}
      description={`/${organization.slug}`}
      actions={
        <Button variant={organization.status === "ACTIVE" ? "destructive" : "default"} onClick={() => setConfirmOpen(true)}>
          {organization.status === "ACTIVE" ? "Suspend" : "Activate"}
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChip
              label={organization.status === "ACTIVE" ? "Active" : "Suspended"}
              tone={organization.status === "ACTIVE" ? "success" : "destructive"}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>{formatDate(organization.createdAt)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            {formatNumber(organization.counts.products)} products · {formatNumber(organization.counts.orders)} orders ·{" "}
            {formatNumber(organization.counts.customers)} customers
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Description: </span>
              {organization.description || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Contact email: </span>
              {organization.contactEmail || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Contact phone: </span>
              {organization.contactPhone || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Address: </span>
              {organization.address || "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administrator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {organization.admin ? (
              <>
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  {organization.admin.name}
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {organization.admin.email}
                </div>
                <div>
                  <span className="text-muted-foreground">Last login: </span>
                  {organization.admin.lastLoginAt ? formatDate(organization.admin.lastLoginAt) : "Never"}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No administrator on this organization.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={nextStatus === "SUSPENDED" ? "Suspend organization?" : "Activate organization?"}
        description={
          nextStatus === "SUSPENDED"
            ? "The organization admin will be unable to sign in until reactivated."
            : "The organization admin will regain access immediately."
        }
        confirmLabel={nextStatus === "SUSPENDED" ? "Suspend" : "Activate"}
        variant={nextStatus === "SUSPENDED" ? "destructive" : "default"}
        isLoading={setStatus.isPending}
        onConfirm={() => setStatus.mutate(nextStatus, { onSuccess: () => setConfirmOpen(false) })}
      />
    </PageContainer>
  );
}
