import { useQuery } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { getProductStats } from "../services/product.service";

export function useProductStats() {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: getProductStats,
  });
}
