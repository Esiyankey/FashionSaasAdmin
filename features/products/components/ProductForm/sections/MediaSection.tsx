"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { FormSection } from "@/components/shared/FormSection";
import { ProductImageManager } from "../../ProductImageManager";
import type { ProductFormValues } from "../schema";

export function MediaSection() {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove, replace } = useFieldArray({ control, name: "images" });

  function handleAdd(files: File[]) {
    const newImages = files.map((file, index) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      alt: "",
      position: fields.length + index,
    }));
    newImages.forEach((image) => append(image));
  }

  function handleRemove(id: string) {
    const index = fields.findIndex((field) => field.id === id);
    if (index !== -1) remove(index);
  }

  return (
    <FormSection title="Media" description="Add photos customers will see in your storefront.">
      <ProductImageManager images={fields} onAdd={handleAdd} onRemove={handleRemove} onReorder={replace} />
    </FormSection>
  );
}
