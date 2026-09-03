import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { createProduct } from "../services/product.service";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
