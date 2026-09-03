"use client";

import { useFormContext } from "react-hook-form";
import { FormSection } from "@/components/shared/FormSection";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { CategoryMultiSelect } from "../../CategoryMultiSelect";
import type { ProductFormValues } from "../schema";

export function VisibilitySection() {
  const { control, watch, setValue } = useFormContext<ProductFormValues>();
  const { data: categories = [] } = useCategories();
  const categoryIds = watch("categoryIds");

  return (
    <>
      <FormSection title="Status">
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="isFeatured"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-y-0">
              <Label>Feature on storefront</Label>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </FormSection>

      <FormSection title="Organization" description="Group this product for browsing and filtering.">
        <div className="space-y-1.5">
          <Label>Categories</Label>
          <CategoryMultiSelect
            categories={categories}
            selectedIds={categoryIds}
            onChange={(ids) => setValue("categoryIds", ids)}
          />
        </div>
      </FormSection>
    </>
  );
}
