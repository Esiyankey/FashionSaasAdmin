import { useQuery } from "@tanstack/react-query";
import { categoryKeys } from "@/services/queries/query-keys";
import { getCategories } from "../services/category.service";

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });
}
