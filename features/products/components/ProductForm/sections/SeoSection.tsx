"use client";

import { useFormContext } from "react-hook-form";
import { FormSection } from "@/components/shared/FormSection";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFormValues } from "../schema";

export function SeoSection() {
  const { control, watch } = useFormContext<ProductFormValues>();
  const seoTitle = watch("seo.title");
  const seoDescription = watch("seo.description");

  return (
    <FormSection title="Search engine listing" description="Customize how this product appears in search results.">
      <FormField
        control={control}
        name="seo.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Page title</FormLabel>
            <FormControl>
              <Input placeholder={watch("title") || "Product title"} {...field} />
            </FormControl>
            <p className="text-xs text-muted-foreground">{seoTitle.length}/70 characters</p>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="seo.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meta description</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="A short description for search engines" {...field} />
            </FormControl>
            <p className="text-xs text-muted-foreground">{seoDescription.length}/160 characters</p>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
