import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderKeys } from "@/services/queries/query-keys";
import { updateOrderStatus } from "../services/order.service";
import type { UpdateOrderStatusInput } from "../types";

export function useUpdateOrderStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrderStatusInput) => updateOrderStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
