import { useQuery } from "@tanstack/react-query";
import { inventoryKeys } from "@/services/queries/query-keys";
import { getInventory } from "../services/inventory.service";
import type { InventoryQueryParams } from "../types";

export function useInventory(params: InventoryQueryParams) {
  return useQuery({ queryKey: inventoryKeys.list(params), queryFn: () => getInventory(params) });
}
