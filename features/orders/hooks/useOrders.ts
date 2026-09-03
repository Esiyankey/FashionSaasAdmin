import { useQuery } from "@tanstack/react-query";
import { orderKeys } from "@/services/queries/query-keys";
import { getOrders } from "../services/order.service";
import type { OrderQueryParams } from "../types";

export function useOrders(params: OrderQueryParams) {
  return useQuery({ queryKey: orderKeys.list(params), queryFn: () => getOrders(params) });
}
