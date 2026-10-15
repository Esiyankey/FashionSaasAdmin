"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useFormContext, type FieldErrors } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { defaultProductFormValues, productFormSchema, type ProductFormValues } from "./schema";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { PricingSection } from "./sections/PricingSection";
import { InventorySection } from "./sections/InventorySection";
import { VariantsSection } from "./sections/VariantsSection";
import { MediaSection } from "./sections/MediaSection";
import { SeoSection } from "./sections/SeoSection";
import { ShippingSection } from "./sections/ShippingSection";
import { VisibilitySection } from "./sections/VisibilitySection";

interface ProductFormProps {
  defaultValues?: ProductFormValues;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  /** Error from the save request; validation messages from the server are listed. */
  serverError?: unknown;
  submitLabel?: string;
}

export function ProductForm({
  defaultValues = defaultProductFormValues,
  onSubmit,
  isSubmitting,
  serverError,
  submitLabel = "Save product",
}: ProductFormProps) {
  const router = useRouter();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 pb-10">
        <ApiErrorAlert error={serverError} />
        <ClientErrorSummary />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <BasicInfoSection />
            <MediaSection />
            <PricingSection />
            <InventorySection />
            <VariantsSection />
            <SeoSection />
            <ShippingSection />
          </div>
          <div className="flex flex-col gap-6">
            <VisibilitySection />
          </div>
        </div>

        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/** Lists validation errors for fields that have no inline message (images, variants, cross-field rules). */
function ClientErrorSummary() {
  const { formState } = useFormContext<ProductFormValues>();
  if (formState.submitCount === 0 || formState.isValid) return null;
  const messages = collectMessages(formState.errors);
  if (messages.length === 0) return null;
  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
      <p className="font-medium">Please fix the following before saving:</p>
      <ul className="mt-1 list-disc pl-4">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

function collectMessages(errors: FieldErrors, path: string[] = []): string[] {
  const result: string[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== "object") continue;
    const entry = value as { message?: unknown; ref?: unknown };
    if (typeof entry.message === "string" && entry.message) {
      result.push(`${[...path, key].join(" › ")}: ${entry.message}`);
    } else {
      result.push(...collectMessages(value as FieldErrors, [...path, key]));
    }
  }
  return [...new Set(result)];
}
