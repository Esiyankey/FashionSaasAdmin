"use client";

import { useState } from "react";
import { FormSection } from "@/components/shared/FormSection";
import { SaveStatus } from "@/components/shared/SaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageField } from "@/features/media/components/ImageField";
import { useUpdateStorefrontConfig } from "@/features/settings/hooks/useSettings";
import type { StorefrontConfig } from "@/features/settings/types";
import { Field } from "./StoreInfoForm";

/** Announcement bar and home hero. */
export function HomeContentForm({ initial }: { initial: StorefrontConfig }) {
  const update = useUpdateStorefrontConfig();
  const [form, setForm] = useState({
    announcementEnabled: initial.announcementEnabled,
    announcementMessage: initial.announcementMessage ?? "",
    announcementHighlight: initial.announcementHighlight ?? "",
    announcementLinkLabel: initial.announcementLinkLabel ?? "",
    announcementLinkHref: initial.announcementLinkHref ?? "",
    announcementShowPhone: initial.announcementShowPhone,
    heroBadgeText: initial.heroBadgeText ?? "",
    heroHeadline: initial.heroHeadline ?? "",
    heroSubheadline: initial.heroSubheadline ?? "",
    heroImageUrl: initial.heroImageUrl,
    heroImageAlt: initial.heroImageAlt,
    heroCtaLabel: initial.heroCtaLabel ?? "",
    heroCtaHref: initial.heroCtaHref ?? "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  function save() {
    update.mutate({
      announcementEnabled: form.announcementEnabled,
      announcementMessage: form.announcementMessage || null,
      announcementHighlight: form.announcementHighlight || null,
      announcementLinkLabel: form.announcementLinkLabel || null,
      announcementLinkHref: form.announcementLinkHref || null,
      announcementShowPhone: form.announcementShowPhone,
      heroBadgeText: form.heroBadgeText || null,
      heroHeadline: form.heroHeadline || null,
      heroSubheadline: form.heroSubheadline || null,
      heroImageUrl: form.heroImageUrl,
      heroImageAlt: form.heroImageAlt,
      heroCtaLabel: form.heroCtaLabel || null,
      heroCtaHref: form.heroCtaHref || null,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Announcement bar" description="The strip above the site header.">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="announcementEnabled">Show announcement bar</Label>
          <Switch id="announcementEnabled" checked={form.announcementEnabled} onCheckedChange={(v) => set("announcementEnabled", v)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Message" id="announcementMessage">
            <Input id="announcementMessage" placeholder="Sign up and" value={form.announcementMessage} onChange={(e) => set("announcementMessage", e.target.value)} />
          </Field>
          <Field label="Highlighted text" id="announcementHighlight">
            <Input id="announcementHighlight" placeholder="get 25% off" value={form.announcementHighlight} onChange={(e) => set("announcementHighlight", e.target.value)} />
          </Field>
          <Field label="Link label" id="announcementLinkLabel">
            <Input id="announcementLinkLabel" placeholder="Shop offers" value={form.announcementLinkLabel} onChange={(e) => set("announcementLinkLabel", e.target.value)} />
          </Field>
          <Field label="Link URL" id="announcementLinkHref" hint="A site path like /shop or a full https:// link.">
            <Input id="announcementLinkHref" placeholder="/shop" value={form.announcementLinkHref} onChange={(e) => set("announcementLinkHref", e.target.value)} />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="announcementShowPhone">Show support phone in the bar</Label>
          <Switch id="announcementShowPhone" checked={form.announcementShowPhone} onCheckedChange={(v) => set("announcementShowPhone", v)} />
        </div>
      </FormSection>

      <FormSection title="Home hero" description="The first thing shoppers see. Leave the headline empty to hide the hero.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Badge text" id="heroBadgeText">
            <Input id="heroBadgeText" placeholder="50% off summer super sale" value={form.heroBadgeText} onChange={(e) => set("heroBadgeText", e.target.value)} />
          </Field>
          <Field label="Headline" id="heroHeadline">
            <Input id="heroHeadline" value={form.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Subheadline" id="heroSubheadline">
              <Textarea id="heroSubheadline" rows={2} value={form.heroSubheadline} onChange={(e) => set("heroSubheadline", e.target.value)} />
            </Field>
          </div>
          <Field label="Button label" id="heroCtaLabel">
            <Input id="heroCtaLabel" placeholder="Shop Now" value={form.heroCtaLabel} onChange={(e) => set("heroCtaLabel", e.target.value)} />
          </Field>
          <Field label="Button link" id="heroCtaHref">
            <Input id="heroCtaHref" placeholder="/shop" value={form.heroCtaHref} onChange={(e) => set("heroCtaHref", e.target.value)} />
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <Label>Hero image</Label>
            <ImageField value={form.heroImageUrl} alt={form.heroImageAlt} onChange={(url) => set("heroImageUrl", url)} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Hero image alt text" id="heroImageAlt">
              <Input id="heroImageAlt" value={form.heroImageAlt} onChange={(e) => set("heroImageAlt", e.target.value)} />
            </Field>
          </div>
        </div>
      </FormSection>

      <div className="flex flex-col gap-3">
        <SaveStatus isSuccess={update.isSuccess} error={update.error} />
        <Button className="self-start" disabled={update.isPending} onClick={save}>
          Save home content
        </Button>
      </div>
    </div>
  );
}
