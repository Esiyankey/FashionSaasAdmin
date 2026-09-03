"use client";

import { useFormContext } from "react-hook-form";
import { FormSection } from "@/components/shared/FormSection";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ProductFormValues } from "../schema";

export function ShippingSection() {
  const { control, watch } = useFormContext<ProductFormValues>();
  const requiresShipping = watch("shipping.requiresShipping");

  return (
    <FormSection title="Shipping" description="Used to calculate accurate shipping rates at checkout.">
      <FormField
        control={control}
        name="shipping.requiresShipping"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between space-y-0">
            <FormLabel>This is a physical product</FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="shipping.weightKg"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Weight (kg)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min={0}
                disabled={!requiresShipping}
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value === "" ? undefined : event.target.valueAsNumber)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
