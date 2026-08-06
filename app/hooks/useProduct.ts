import { useQuery } from "@tanstack/react-query";
import type { Product } from "~/types";

export const productQueryKeys = {
  all: ["product"] as const,
  detailsForProduct: (productId: string | number) =>
    [...productQueryKeys.all, String(productId)] as const,
  detail: (productId: string, variationId?: string) =>
    [
      ...productQueryKeys.detailsForProduct(productId),
      variationId ?? null,
    ] as const,
};

export async function fetchProductQuery(
  productId: string,
  token: string,
  variationId?: string,
): Promise<Product> {
  const params = new URLSearchParams();
  if (variationId) {
    params.set("variation_id", variationId);
  }

  const query = params.toString();
  const response = await fetch(
    `/api/products/${productId}${query ? `?${query}` : ""}`,
    {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | Product
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : "Erro ao carregar o produto.";
    throw new Error(message || "Erro ao carregar o produto.");
  }

  return payload as Product;
}

type UseProductQueryOptions = {
  productId: string;
  token: string;
  variationId?: string;
};

export function useProductQuery({
  productId,
  token,
  variationId,
}: UseProductQueryOptions) {
  return useQuery({
    queryKey: productQueryKeys.detail(productId, variationId),
    queryFn: () => fetchProductQuery(productId, token, variationId),
    staleTime: 0,
  });
}
