"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  submitLabel?: string;
}

export function ProductForm({
  defaultValues = defaultProductFormValues,
  onSubmit,
  isSubmitting,
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
