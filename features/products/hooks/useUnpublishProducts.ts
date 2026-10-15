import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { unpublishProducts } from "../services/product.service";

export function useUnpublishProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unpublishProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
