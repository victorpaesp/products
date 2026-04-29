import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "~/types";
import {
  productsQueryKeys,
  ProductsQueryParams,
  toProductsApiParams,
} from "~/lib/products-query";

export async function fetchProductsQuery(
  params: ProductsQueryParams,
): Promise<ApiResponse> {
  const query = toProductsApiParams(params);
  const response = await fetch(`/api/products?${query.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | ApiResponse
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : "Erro ao carregar os produtos.";
    throw new Error(message || "Erro ao carregar os produtos.");
  }

  return payload as ApiResponse;
}

export function useProductsQuery(params: ProductsQueryParams) {
  return useQuery({
    queryKey: productsQueryKeys.list(params),
    queryFn: () => fetchProductsQuery(params),
    placeholderData: keepPreviousData,
  });
}
