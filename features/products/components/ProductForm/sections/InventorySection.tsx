"use client";

import { useFormContext } from "react-hook-form";
import { FormSection } from "@/components/shared/FormSection";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ProductFormValues } from "../schema";

export function InventorySection() {
  const { control, watch } = useFormContext<ProductFormValues>();
  const trackQuantity = watch("inventory.trackQuantity");
  const hasVariants = watch("variants").length > 0;

  return (
    <FormSection title="Inventory" description="Track stock levels and low-stock alerts.">
      <FormField
        control={control}
        name="inventory.trackQuantity"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between space-y-0">
            <div>
              <FormLabel>Track quantity</FormLabel>
              <p className="text-xs text-muted-foreground">Automatically reduce stock as orders come in.</p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {hasVariants ? (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          This product has variants — quantity is tracked per variant in the Variants section below.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="inventory.quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    disabled={!trackQuantity}
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
            name="inventory.lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low stock threshold</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    disabled={!trackQuantity}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormField
        control={control}
        name="inventory.allowBackorder"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between space-y-0">
            <div>
              <FormLabel>Allow backorders</FormLabel>
              <p className="text-xs text-muted-foreground">Let customers purchase when out of stock.</p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!trackQuantity} />
            </FormControl>
          </FormItem>
        )}
      />
    </FormSection>
  );
}
