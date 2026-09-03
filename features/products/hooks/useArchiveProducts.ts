import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { archiveProducts } from "../services/product.service";

export function useArchiveProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
