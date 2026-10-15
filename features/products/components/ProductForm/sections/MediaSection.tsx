"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { FormSection } from "@/components/shared/FormSection";
import { uploadMedia } from "@/features/media/services/media.service";
import { ApiError } from "@/services/http-client";
import { ProductImageManager } from "../../ProductImageManager";
import type { ProductFormValues } from "../schema";

export function MediaSection() {
  const { control, getValues, formState } = useFormContext<ProductFormValues>();
  const { fields, append, remove, replace } = useFieldArray({ control, name: "images" });
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /** Files are uploaded to the media library first so the product only ever stores durable URLs. */
  async function handleAdd(files: File[]) {
    setError(null);
    setUploading((count) => count + files.length);
    const title = getValues("title");
    for (const file of files) {
      try {
        const asset = await uploadMedia(file, title);
        append({ id: crypto.randomUUID(), url: asset.url, alt: title, position: getValues("images").length });
      } catch (err) {
        const detail = err instanceof ApiError ? (Object.values(err.fieldErrors ?? {})[0]?.[0] ?? err.message) : "Upload failed";
        setError(`${file.name}: ${detail}`);
      } finally {
        setUploading((count) => count - 1);
      }
    }
  }

  function handleRemove(id: string) {
    const index = fields.findIndex((field) => field.id === id);
    if (index !== -1) remove(index);
  }

  const imagesError = formState.errors.images?.message ?? formState.errors.images?.root?.message;

  return (
    <FormSection title="Media" description="Add photos customers will see in your storefront.">
      <ProductImageManager images={fields} onAdd={handleAdd} onRemove={handleRemove} onReorder={replace} />
      {uploading > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Uploading {uploading} image{uploading > 1 ? "s" : ""}…
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {imagesError && <p className="text-sm text-destructive">{imagesError}</p>}
    </FormSection>
  );
}
