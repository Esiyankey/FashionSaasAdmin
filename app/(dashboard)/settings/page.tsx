"use client";

import { useState } from "react";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { FormSection } from "@/components/shared/FormSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useSettings,
  useStorefrontConfig,
  useUpdateSettings,
  useUpdateStorefrontConfig,
} from "@/features/settings/hooks/useSettings";
import type { OrganizationSettings, StorefrontConfig } from "@/features/settings/types";

export default function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: storefront, isLoading: storefrontLoading } = useStorefrontConfig();

  if (settingsLoading || storefrontLoading || !settings || !storefront) {
    return (
      <PageContainer title="Settings">
        <LoadingState rows={6} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Settings" description="Business preferences and storefront configuration.">
      <div className="flex max-w-2xl flex-col gap-6 pb-10">
        <BusinessSettingsForm initial={settings} />
        <StorefrontBrandingForm initial={storefront} />
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

function StorefrontBrandingForm({ initial }: { initial: StorefrontConfig }) {
  const updateStorefront = useUpdateStorefrontConfig();
  const [form, setForm] = useState({
    storeName: initial.storeName,
    primaryColor: initial.primaryColor,
    secondaryColor: initial.secondaryColor,
    heroHeadline: initial.heroHeadline ?? "",
    heroSubheadline: initial.heroSubheadline ?? "",
    footerText: initial.footerText ?? "",
  });

  return (
    <FormSection title="Storefront branding" description="How your public storefront looks.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="storeName">Store name</Label>
          <Input id="storeName" value={form.storeName} onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary color</Label>
          <Input
            id="primaryColor"
            type="color"
            value={form.primaryColor}
            onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Secondary color</Label>
          <Input
            id="secondaryColor"
            type="color"
            value={form.secondaryColor}
            onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="heroHeadline">Hero headline</Label>
          <Input
            id="heroHeadline"
            value={form.heroHeadline}
            onChange={(e) => setForm((f) => ({ ...f, heroHeadline: e.target.value }))}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="heroSubheadline">Hero subheadline</Label>
          <Input
            id="heroSubheadline"
            value={form.heroSubheadline}
            onChange={(e) => setForm((f) => ({ ...f, heroSubheadline: e.target.value }))}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="footerText">Footer text</Label>
          <Textarea id="footerText" value={form.footerText} onChange={(e) => setForm((f) => ({ ...f, footerText: e.target.value }))} />
        </div>
      </div>
      <Button
        className="mt-4"
        disabled={updateStorefront.isPending}
        onClick={() =>
          updateStorefront.mutate({
            storeName: form.storeName,
            primaryColor: form.primaryColor,
            secondaryColor: form.secondaryColor,
            heroHeadline: form.heroHeadline || null,
            heroSubheadline: form.heroSubheadline || null,
            footerText: form.footerText || null,
          })
        }
      >
        Save storefront branding
      </Button>
    </FormSection>
  );
}
