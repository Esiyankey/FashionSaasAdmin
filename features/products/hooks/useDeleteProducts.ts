import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { deleteProducts } from "../services/product.service";

export function useDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
