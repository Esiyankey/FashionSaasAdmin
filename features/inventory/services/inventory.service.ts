import { apiClient } from "@/services/http-client";
import type { AdjustInventoryInput, InventoryListResult, InventoryQueryParams } from "../types";

export function getInventory(params: InventoryQueryParams): Promise<InventoryListResult> {
  return apiClient.get<InventoryListResult>("/admin/inventory", { params });
}

export function adjustInventory(productId: string, input: AdjustInventoryInput): Promise<void> {
  return apiClient.post<void>(`/admin/inventory/${productId}/adjust`, { body: input });
}
