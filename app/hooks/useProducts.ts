import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "~/types";
import {
  productsQueryKeys,
  ProductsQueryParams,
  toProductsApiParams,
} from "~/lib/products-query";

export async function fetchProductsQuery(
  params: ProductsQueryParams,
  token: string,
): Promise<ApiResponse> {
  const query = toProductsApiParams(params);
  const response = await fetch(`/api/all-products?${query.toString()}`, {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

type UseProductsQueryOptions = {
  token: string;
};

export function useProductsQuery(
  params: ProductsQueryParams,
  { token }: UseProductsQueryOptions,
) {
  return useQuery({
    queryKey: productsQueryKeys.list(params),
    queryFn: () => fetchProductsQuery(params, token),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
