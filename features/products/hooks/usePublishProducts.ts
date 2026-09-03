import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { publishProducts } from "../services/product.service";

export function usePublishProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
