import { useQuery } from "@tanstack/react-query";
import { orderKeys } from "@/services/queries/query-keys";
import { getOrder } from "../services/order.service";

export function useOrder(id: string) {
  return useQuery({ queryKey: orderKeys.detail(id), queryFn: () => getOrder(id), enabled: Boolean(id) });
}
