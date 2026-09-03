import { useQuery } from "@tanstack/react-query";
import { customerKeys } from "@/services/queries/query-keys";
import { getCustomer } from "../services/customer.service";

export function useCustomer(id: string) {
  return useQuery({ queryKey: customerKeys.detail(id), queryFn: () => getCustomer(id), enabled: Boolean(id) });
}
