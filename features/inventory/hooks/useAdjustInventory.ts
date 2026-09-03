import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryKeys, productKeys } from "@/services/queries/query-keys";
import { adjustInventory } from "../services/inventory.service";
import type { AdjustInventoryInput } from "../types";

export function useAdjustInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: AdjustInventoryInput }) => adjustInventory(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
