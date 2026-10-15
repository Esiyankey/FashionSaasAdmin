"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/services/http-client";
import { uploadMedia } from "../services/media.service";

interface ImageFieldProps {
  id?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  /** Alt text sent with the upload. */
  alt?: string;
}

/**
 * Image picker: uploads to the media library (stored server-side, served at
 * /media/{id}) or accepts an existing https:// or site-relative URL.
 */
export function ImageField({ id, value, onChange, alt = "" }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const asset = await uploadMedia(file, alt);
      onChange(asset.url);
    } catch (err) {
      setError(err instanceof ApiError ? (Object.values(err.fieldErrors ?? {})[0]?.[0] ?? err.message) : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={alt} className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Input
            id={id}
            placeholder="Upload an image or paste an https:// URL"
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value.trim() || null)}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" disabled={isUploading} onClick={() => inputRef.current?.click()}>
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
              Upload
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
                <X />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
