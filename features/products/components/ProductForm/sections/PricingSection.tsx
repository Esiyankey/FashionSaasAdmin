"use client";

import { useFormContext } from "react-hook-form";
import { FormSection } from "@/components/shared/FormSection";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";
import type { ProductFormValues } from "../schema";

export function PricingSection() {
  const { control, watch } = useFormContext<ProductFormValues>();
  const price = watch("price");
  const costPerItem = watch("costPerItem");
  const margin = costPerItem !== undefined && price > 0 ? ((price - costPerItem) / price) * 100 : undefined;

  return (
    <FormSection title="Pricing" description="Set the base price shown to customers.">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="compareAtPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compare-at price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value === "" ? undefined : event.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="costPerItem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost per item</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value === "" ? undefined : event.target.valueAsNumber)}
                />
              </FormControl>
              {margin !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {margin.toFixed(1)}% margin ({formatCurrency(price - (costPerItem ?? 0))} profit)
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="e.g. SKU-1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="barcode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Barcode (ISBN, UPC, GTIN)</FormLabel>
            <FormControl>
              <Input placeholder="e.g. 123456789012" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
