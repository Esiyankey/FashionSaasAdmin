"use client";

import { useState } from "react";
import { FormSection } from "@/components/shared/FormSection";
import { SaveStatus } from "@/components/shared/SaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageField } from "@/features/media/components/ImageField";
import { useUpdateStorefrontConfig } from "@/features/settings/hooks/useSettings";
import type { StorefrontConfig } from "@/features/settings/types";

const SOCIAL_PLATFORMS = ["instagram", "facebook", "x", "tiktok", "youtube", "pinterest", "linkedin"] as const;

/** Store identity, SEO defaults and the single source of contact details shown across the storefront. */
export function StoreInfoForm({ initial }: { initial: StorefrontConfig }) {
  const update = useUpdateStorefrontConfig();
  const [form, setForm] = useState({
    storeName: initial.storeName,
    logoUrl: initial.logoUrl,
    primaryColor: initial.primaryColor,
    secondaryColor: initial.secondaryColor,
    siteUrl: initial.siteUrl ?? "",
    seoTitle: initial.seoTitle ?? "",
    seoDescription: initial.seoDescription ?? "",
    footerText: initial.footerText ?? "",
    contactEmail: initial.contactEmail ?? "",
    contactPhone: initial.contactPhone ?? "",
    addressLines: initial.addressLines.join("\n"),
    workingHours: initial.workingHours ?? "",
    mapEmbedUrl: initial.mapEmbedUrl ?? "",
    socialLinks: { ...(initial.socialLinks ?? {}) } as Record<string, string>,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  function save() {
    const socialLinks = Object.fromEntries(Object.entries(form.socialLinks).filter(([, url]) => url.trim()));
    update.mutate({
      storeName: form.storeName,
      logoUrl: form.logoUrl,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      siteUrl: form.siteUrl || null,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      footerText: form.footerText || null,
      contactEmail: form.contactEmail || null,
      contactPhone: form.contactPhone || null,
      addressLines: form.addressLines.split("\n").map((line) => line.trim()).filter(Boolean),
      workingHours: form.workingHours || null,
      mapEmbedUrl: form.mapEmbedUrl || null,
      socialLinks: Object.keys(socialLinks).length ? socialLinks : null,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Store identity" description="Name, logo, colours and search-engine defaults.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name" id="storeName">
            <Input id="storeName" value={form.storeName} onChange={(e) => set("storeName", e.target.value)} />
          </Field>
          <Field label="Site URL" id="siteUrl" hint="Used for canonical links and the sitemap.">
            <Input id="siteUrl" placeholder="https://shop.example.com" value={form.siteUrl} onChange={(e) => set("siteUrl", e.target.value)} />
          </Field>
          <Field label="Primary colour" id="primaryColor">
            <Input id="primaryColor" type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
          </Field>
          <Field label="Secondary colour" id="secondaryColor">
            <Input id="secondaryColor" type="color" value={form.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} />
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <Label>Logo</Label>
            <ImageField value={form.logoUrl} alt={form.storeName} onChange={(url) => set("logoUrl", url)} />
          </div>
          <Field label="Default SEO title" id="seoTitle">
            <Input id="seoTitle" maxLength={70} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
          </Field>
          <Field label="Default SEO description" id="seoDescription">
            <Input id="seoDescription" maxLength={320} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Footer text" id="footerText">
              <Textarea id="footerText" rows={2} value={form.footerText} onChange={(e) => set("footerText", e.target.value)} />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection title="Contact details" description="Shown in the header bar, contact page and footer — one value everywhere.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Support email" id="contactEmail">
            <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
          <Field label="Support phone" id="contactPhone">
            <Input id="contactPhone" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </Field>
          <Field label="Address (one line per row, up to 4)" id="addressLines">
            <Textarea id="addressLines" rows={3} value={form.addressLines} onChange={(e) => set("addressLines", e.target.value)} />
          </Field>
          <Field label="Working hours" id="workingHours">
            <Input id="workingHours" placeholder="Mon – Sat: 9:00 – 17:00" value={form.workingHours} onChange={(e) => set("workingHours", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Google Maps embed URL" id="mapEmbedUrl" hint="Must start with https://www.google.com/maps/embed?">
              <Input id="mapEmbedUrl" value={form.mapEmbedUrl} onChange={(e) => set("mapEmbedUrl", e.target.value)} />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection title="Social links" description="Leave blank to hide a network.">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <Field key={platform} label={platform === "x" ? "X (Twitter)" : platform[0].toUpperCase() + platform.slice(1)} id={`social-${platform}`}>
              <Input
                id={`social-${platform}`}
                placeholder="https://"
                value={form.socialLinks[platform] ?? ""}
                onChange={(e) => set("socialLinks", { ...form.socialLinks, [platform]: e.target.value })}
              />
            </Field>
          ))}
        </div>
      </FormSection>

      <div className="flex flex-col gap-3">
        <SaveStatus isSuccess={update.isSuccess} error={update.error} />
        <Button className="self-start" disabled={update.isPending} onClick={save}>
          Save store details
        </Button>
      </div>
    </div>
  );
}

export function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
