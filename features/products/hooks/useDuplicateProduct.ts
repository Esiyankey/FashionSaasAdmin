import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { duplicateProduct } from "../services/product.service";

export function useDuplicateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
