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
import { useSavePage } from "../hooks";
import type { AboutPageContent, ImageWithAlt } from "../types";
import { Field } from "./StoreInfoForm";

const EMPTY: AboutPageContent = {
  hero: { eyebrow: "", title: "", image: null },
  story: { eyebrow: "", heading: "", body: "", images: [], ctaLabel: "", ctaHref: "" },
  quote: null,
  inspiration: { heading: "", body: "", image: null, ctaLabel: "", ctaHref: "" },
};

function ImageWithAltField({ value, onChange }: { value: ImageWithAlt | null; onChange: (value: ImageWithAlt | null) => void }) {
  return (
    <div className="space-y-2">
      <ImageField value={value?.url} alt={value?.alt} onChange={(url) => onChange(url ? { url, alt: value?.alt ?? "" } : null)} />
      {value && (
        <Input aria-label="Alt text" placeholder="Alt text" value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
      )}
    </div>
  );
}

/** Structured editor for the About page's sections (not a free-form page builder). */
export function AboutPageEditor({ initial }: { initial: AboutPageContent | null }) {
  const save = useSavePage<AboutPageContent>("about");
  const [page, setPage] = useState<AboutPageContent>(initial ?? EMPTY);
  const patch = <S extends keyof AboutPageContent>(section: S, value: Partial<NonNullable<AboutPageContent[S]>>) =>
    setPage((current) => ({ ...current, [section]: { ...(current[section] ?? {}), ...value } }));

  const storyImages: (ImageWithAlt | null)[] = [0, 1, 2].map((index) => page.story.images[index] ?? null);

  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Hero" description="Banner at the top of the About page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" id="about-hero-eyebrow">
            <Input id="about-hero-eyebrow" value={page.hero.eyebrow} onChange={(e) => patch("hero", { eyebrow: e.target.value })} />
          </Field>
          <Field label="Title (required)" id="about-hero-title">
            <Input id="about-hero-title" value={page.hero.title} onChange={(e) => patch("hero", { title: e.target.value })} />
          </Field>
        </div>
        <Label>Background image</Label>
        <ImageWithAltField value={page.hero.image} onChange={(image) => patch("hero", { image })} />
      </FormSection>

      <FormSection title="Story" description="The brand story section with an image collage.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" id="about-story-eyebrow">
            <Input id="about-story-eyebrow" value={page.story.eyebrow} onChange={(e) => patch("story", { eyebrow: e.target.value })} />
          </Field>
          <Field label="Heading" id="about-story-heading">
            <Input id="about-story-heading" value={page.story.heading} onChange={(e) => patch("story", { heading: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Body" id="about-story-body">
              <Textarea id="about-story-body" rows={4} value={page.story.body} onChange={(e) => patch("story", { body: e.target.value })} />
            </Field>
          </div>
          <Field label="Button label" id="about-story-cta">
            <Input id="about-story-cta" value={page.story.ctaLabel ?? ""} onChange={(e) => patch("story", { ctaLabel: e.target.value })} />
          </Field>
          <Field label="Button link" id="about-story-href">
            <Input id="about-story-href" placeholder="/shop" value={page.story.ctaHref ?? ""} onChange={(e) => patch("story", { ctaHref: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {storyImages.map((image, index) => (
            <div key={index} className="space-y-2">
              <Label>Collage image {index + 1}</Label>
              <ImageWithAltField
                value={image}
                onChange={(next) => {
                  const images = [...storyImages];
                  images[index] = next;
                  patch("story", { images: images.filter((entry): entry is ImageWithAlt => Boolean(entry)) });
                }}
              />
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Founder quote">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="about-quote-toggle">Show quote</Label>
          <Switch
            id="about-quote-toggle"
            checked={page.quote !== null}
            onCheckedChange={(on) => setPage((current) => ({ ...current, quote: on ? { text: "", author: "", role: "" } : null }))}
          />
        </div>
        {page.quote && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Quote" id="about-quote-text">
                <Textarea id="about-quote-text" rows={3} value={page.quote.text} onChange={(e) => patch("quote", { text: e.target.value })} />
              </Field>
            </div>
            <Field label="Name" id="about-quote-author">
              <Input id="about-quote-author" value={page.quote.author} onChange={(e) => patch("quote", { author: e.target.value })} />
            </Field>
            <Field label="Role" id="about-quote-role">
              <Input id="about-quote-role" value={page.quote.role} onChange={(e) => patch("quote", { role: e.target.value })} />
            </Field>
          </div>
        )}
      </FormSection>

      <FormSection title="Inspiration" description="Closing section with an image and call to action.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading" id="about-insp-heading">
            <Input id="about-insp-heading" value={page.inspiration.heading} onChange={(e) => patch("inspiration", { heading: e.target.value })} />
          </Field>
          <Field label="Button label" id="about-insp-cta">
            <Input id="about-insp-cta" value={page.inspiration.ctaLabel ?? ""} onChange={(e) => patch("inspiration", { ctaLabel: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Body" id="about-insp-body">
              <Textarea id="about-insp-body" rows={3} value={page.inspiration.body} onChange={(e) => patch("inspiration", { body: e.target.value })} />
            </Field>
          </div>
          <Field label="Button link" id="about-insp-href">
            <Input id="about-insp-href" placeholder="/shop" value={page.inspiration.ctaHref ?? ""} onChange={(e) => patch("inspiration", { ctaHref: e.target.value })} />
          </Field>
        </div>
        <Label>Image</Label>
        <ImageWithAltField value={page.inspiration.image} onChange={(image) => patch("inspiration", { image })} />
      </FormSection>

      <div className="flex flex-col gap-3">
        <SaveStatus isSuccess={save.isSuccess} error={save.error} />
        <Button className="self-start" disabled={save.isPending} onClick={() => save.mutate(page)}>
          Save About page
        </Button>
      </div>
    </div>
  );
}
