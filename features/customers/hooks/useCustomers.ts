import { useQuery } from "@tanstack/react-query";
import { customerKeys } from "@/services/queries/query-keys";
import { getCustomers } from "../services/customer.service";
import type { CustomerQueryParams } from "../types";

export function useCustomers(params: CustomerQueryParams) {
  return useQuery({ queryKey: customerKeys.list(params), queryFn: () => getCustomers(params) });
}
