import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { updateProduct } from "../services/product.service";
import type { ProductInput } from "../types";

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductInput) => updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
  });
}
