import { apiClient } from "@/services/http-client";
import type { PaginatedResult } from "@/types/common";

export interface MediaAsset {
  id: string;
  /** Site-relative path (`/media/{id}`); the public API returns it as an absolute URL. */
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  alt: string;
  createdAt: string;
}

export function uploadMedia(file: File, alt = ""): Promise<MediaAsset> {
  const body = new FormData();
  body.append("file", file);
  body.append("alt", alt);
  return apiClient.post<MediaAsset>("/admin/media", { body });
}

export function getMedia(params: { page: number; pageSize: number; search?: string }): Promise<PaginatedResult<MediaAsset>> {
  return apiClient.get<PaginatedResult<MediaAsset>>("/admin/media", { params });
}

export function deleteMedia(id: string): Promise<void> {
  return apiClient.delete<void>(`/admin/media/${id}`);
}
