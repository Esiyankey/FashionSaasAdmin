"use client";

import { useState, type DragEvent } from "react";
import Image from "next/image";
import { GripVertical, Star, Trash2, ZoomIn } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductImage } from "../types";

interface ProductImageManagerProps {
  images: ProductImage[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onReorder: (images: ProductImage[]) => void;
}

export function ProductImageManager({ images, onAdd, onRemove, onReorder }: ProductImageManagerProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null);

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const fromIndex = images.findIndex((image) => image.id === draggedId);
    const toIndex = images.findIndex((image) => image.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorder(reordered.map((image, index) => ({ ...image, position: index })));
    setDraggedId(null);
  }

  function makeCover(id: string) {
    const target = images.find((image) => image.id === id);
    if (!target) return;
    const rest = images.filter((image) => image.id !== id);
    onReorder([target, ...rest].map((image, index) => ({ ...image, position: index })));
  }

  return (
    <div className="space-y-4">
      <FileUpload
        onFilesSelected={onAdd}
        hint="PNG, JPG, or WEBP — first image is used as the cover"
      />

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => setDraggedId(image.id)}
              onDragOver={(event: DragEvent) => event.preventDefault()}
              onDrop={() => handleDrop(image.id)}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
                draggedId === image.id && "opacity-50"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt ?? ""}
                fill
                sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                unoptimized={image.url.startsWith("blob:")}
                className="object-cover"
              />
              {index === 0 && (
                <Badge className="absolute left-1.5 top-1.5 gap-1" variant="secondary">
                  <Star className="size-3" />
                  Cover
                </Badge>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-background/0 opacity-0 transition-opacity group-hover:bg-background/40 group-hover:opacity-100">
                <Button type="button" variant="secondary" size="icon-sm" aria-label="Preview" onClick={() => setPreviewImage(image)}>
                  <ZoomIn className="size-4" />
                </Button>
                {index !== 0 && (
                  <Button type="button" variant="secondary" size="icon-sm" aria-label="Make cover image" onClick={() => makeCover(image.id)}>
                    <Star className="size-4" />
                  </Button>
                )}
                <Button type="button" variant="destructive" size="icon-sm" aria-label="Remove image" onClick={() => onRemove(image.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="absolute bottom-1.5 right-1.5 rounded-md bg-background/70 p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="size-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!previewImage} onOpenChange={() => setPreviewImage(null)} title="Image preview">
        {previewImage && (
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={previewImage.url}
              alt={previewImage.alt ?? ""}
              fill
              sizes="(min-width: 640px) 36rem, 100vw"
              unoptimized={previewImage.url.startsWith("blob:")}
              className="object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
