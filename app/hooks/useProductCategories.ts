import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminProductsQueryKeys } from "~/lib/admin-products";
import { normalizeProductCategories } from "~/lib/product-categories";
import { productQueryKeys } from "~/hooks/useProduct";

export const productCategoriesQueryKeys = {
  detail: (productId: string | number) =>
    ["product-categories", String(productId)] as const,
};

async function request(input: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(input, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error)
        : "Erro ao alterar as categorias.";
    throw new Error(message);
  }
  return payload;
}

async function fetchProductCategories(productId: string | number) {
  return normalizeProductCategories(
    await request(`/api/products/${productId}/categories`),
  );
}

export function useProductCategoriesQuery(productId: string | number) {
  return useQuery({
    queryKey: productCategoriesQueryKeys.detail(productId),
    queryFn: () => fetchProductCategories(productId),
  });
}

export function useSaveProductCategoriesMutation(productId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      currentIds,
      selectedIds,
    }: {
      currentIds: string[];
      selectedIds: string[];
    }) => {
      const current = new Set(currentIds);
      const selected = new Set(selectedIds);
      const additions = selectedIds.filter((id) => !current.has(id));
      const removals = currentIds.filter((id) => !selected.has(id));

      if (additions.length) {
        await request(`/api/products/${productId}/categories`, {
          method: "POST",
          body: JSON.stringify({ category_ids: additions }),
        });
      }
      await Promise.all(
        removals.map((id) =>
          request(`/api/products/${productId}/categories/${id}`, {
            method: "DELETE",
          }),
        ),
      );
      return fetchProductCategories(productId);
    },
    onSuccess: async (categories) => {
      queryClient.setQueryData(
        productCategoriesQueryKeys.detail(productId),
        categories,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminProductsQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: productQueryKeys.detailsForProduct(productId),
        }),
      ]);
    },
  });
}
