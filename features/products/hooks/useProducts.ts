import { useQuery } from "@tanstack/react-query";
import { productKeys } from "@/services/queries/query-keys";
import { getProducts } from "../services/product.service";
import type { ProductQueryParams } from "../types";

export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
  });
}
