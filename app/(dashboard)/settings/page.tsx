"use client";

import { useState } from "react";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { FormSection } from "@/components/shared/FormSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SaveStatus } from "@/components/shared/SaveStatus";
import { useSettings, useUpdateSettings } from "@/features/settings/hooks/useSettings";
import type { OrganizationSettings } from "@/features/settings/types";

export default function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();

  if (settingsLoading || !settings) {
    return (
      <PageContainer title="Settings">
        <LoadingState rows={6} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Settings" description="Currency, tax and shipping used to price storefront orders.">
      <div className="flex max-w-2xl flex-col gap-6 pb-10">
        <BusinessSettingsForm initial={settings} />
        <p className="text-sm text-muted-foreground">
          Store name, branding, contact details, hero and navigation are edited under{" "}
          <Link href="/content" className="underline">
            Storefront content
          </Link>
          .
        </p>
      </div>
    </PageContainer>
  );
}

function BusinessSettingsForm({ initial }: { initial: OrganizationSettings }) {
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState({
    currency: initial.currency,
    orderNumberPrefix: initial.orderNumberPrefix,
    taxRatePercent: initial.taxRatePercent,
    shippingFlatRate: initial.shippingFlatRate,
    freeShippingThreshold: initial.freeShippingThreshold?.toString() ?? "",
    lowStockThresholdDefault: initial.lowStockThresholdDefault,
  });

  return (
    <FormSection title="Business settings" description="Currency, tax, and shipping defaults.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
            maxLength={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="orderPrefix">Order number prefix</Label>
          <Input
            id="orderPrefix"
            value={form.orderNumberPrefix}
            onChange={(e) => setForm((f) => ({ ...f, orderNumberPrefix: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            step="0.1"
            value={form.taxRatePercent}
            onChange={(e) => setForm((f) => ({ ...f, taxRatePercent: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shippingRate">Flat shipping rate</Label>
          <Input
            id="shippingRate"
            type="number"
            step="0.01"
            value={form.shippingFlatRate}
            onChange={(e) => setForm((f) => ({ ...f, shippingFlatRate: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="freeShipping">Free shipping over</Label>
          <Input
            id="freeShipping"
            type="number"
            step="0.01"
            placeholder="No minimum"
            value={form.freeShippingThreshold}
            onChange={(e) => setForm((f) => ({ ...f, freeShippingThreshold: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lowStock">Default low-stock threshold</Label>
          <Input
            id="lowStock"
            type="number"
            value={form.lowStockThresholdDefault}
            onChange={(e) => setForm((f) => ({ ...f, lowStockThresholdDefault: Number(e.target.value) }))}
          />
        </div>
      </div>
      <SaveStatus
        isSuccess={updateSettings.isSuccess}
        error={updateSettings.error}
        message="Saved. New orders use these values; existing orders keep theirs."
      />
      <Button
        className="mt-4"
        disabled={updateSettings.isPending}
        onClick={() =>
          updateSettings.mutate({
            currency: form.currency,
            orderNumberPrefix: form.orderNumberPrefix,
            taxRatePercent: form.taxRatePercent,
            shippingFlatRate: form.shippingFlatRate,
            freeShippingThreshold: form.freeShippingThreshold ? Number(form.freeShippingThreshold) : null,
            lowStockThresholdDefault: form.lowStockThresholdDefault,
          })
        }
      >
        Save business settings
      </Button>
    </FormSection>
  );
}
