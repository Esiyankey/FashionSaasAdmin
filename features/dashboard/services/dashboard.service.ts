import { apiClient } from "@/services/http-client";
import type { DashboardSummary } from "../types";

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiClient.get<DashboardSummary>("/admin/dashboard/summary");
}
