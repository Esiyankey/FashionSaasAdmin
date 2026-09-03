import { apiClient } from "@/services/http-client";
import type { PlatformSummary } from "../types";

export function getPlatformSummary(): Promise<PlatformSummary> {
  return apiClient.get<PlatformSummary>("/admin/platform/summary");
}
