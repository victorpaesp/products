import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AdminProductsResponse } from "~/types";
import { adminProductsQueryKeys } from "~/lib/admin-products";
import {
  toProductsApiParams,
  type ProductsQueryParams,
} from "~/lib/products-query";

async function fetchAdminProductsQuery(
  params: ProductsQueryParams,
): Promise<AdminProductsResponse> {
  const query = toProductsApiParams(params);
  const response = await fetch(`/api/admin-products?${query.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });
  const payload = (await response.json().catch(() => null)) as
    | AdminProductsResponse
    | { error?: string }
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : undefined;
    throw new Error(message || "Erro ao carregar os produtos.");
  }

  return payload as AdminProductsResponse;
}

export function useAdminProductsQuery(params: ProductsQueryParams) {
  return useQuery({
    queryKey: adminProductsQueryKeys.list(params),
    queryFn: () => fetchAdminProductsQuery(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
