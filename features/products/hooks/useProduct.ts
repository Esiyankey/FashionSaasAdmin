import { useQuery } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { getProduct } from "../services/product.service";

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  });
}
