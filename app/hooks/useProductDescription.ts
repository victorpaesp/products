import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AdminProductListItem,
  AdminProductsResponse,
  ApiResponse,
  Product,
} from "~/types";
import { adminProductsQueryKeys } from "~/lib/admin-products";
import { productsQueryKeys } from "~/lib/products-query";
import type { ApiProductDescriptionActionData } from "~/types/routes";
import { productQueryKeys } from "~/hooks/useProduct";
import { normalizeDescriptionOverride } from "~/lib/product-description";

type UpdateProductDescriptionPayload = {
  productId: number;
  descriptionOverride: string | null;
};

type OptimisticContext = {
  previousAdminLists: Array<
    readonly [readonly unknown[], AdminProductsResponse | undefined]
  >;
  previousLists: Array<readonly [readonly unknown[], ApiResponse | undefined]>;
  previousDetails: Array<readonly [readonly unknown[], Product | undefined]>;
};

function withDescriptionOverride(
  product: AdminProductListItem,
  descriptionOverride: string | null,
): AdminProductListItem {
  const hasManualDescription = descriptionOverride !== null;

  return {
    ...product,
    description_source: hasManualDescription ? "manual" : "supplier",
    has_description: hasManualDescription || product.has_original_description,
  };
}

async function submitProductDescription(
  payload: UpdateProductDescriptionPayload,
): Promise<ApiProductDescriptionActionData> {
  const formData = new FormData();
  formData.set("description_override", payload.descriptionOverride || "");

  const response = await fetch(
    `/api/products/${payload.productId}/description`,
    {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    },
  );

  const body = (await response
    .json()
    .catch(() => null)) as ApiProductDescriptionActionData | null;

  if (!response.ok) {
    throw new Error(body?.error || "Erro ao atualizar descrição.");
  }

  return body || { ok: true };
}

export function useUpdateProductDescriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiProductDescriptionActionData,
    Error,
    UpdateProductDescriptionPayload,
    OptimisticContext
  >({
    mutationFn: submitProductDescription,
    onMutate: async ({ productId, descriptionOverride }) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: adminProductsQueryKeys.lists(),
        }),
        queryClient.cancelQueries({ queryKey: productsQueryKeys.lists() }),
        queryClient.cancelQueries({
          queryKey: productQueryKeys.detailsForProduct(productId),
        }),
      ]);

      const previousAdminLists =
        queryClient.getQueriesData<AdminProductsResponse>({
          queryKey: adminProductsQueryKeys.lists(),
        });
      const previousLists = queryClient.getQueriesData<ApiResponse>({
        queryKey: productsQueryKeys.lists(),
      });
      const previousDetails = queryClient.getQueriesData<Product>({
        queryKey: productQueryKeys.detailsForProduct(productId),
      });

      queryClient.setQueriesData<AdminProductsResponse>(
        { queryKey: adminProductsQueryKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((product) =>
              product.id === productId
                ? withDescriptionOverride(product, descriptionOverride)
                : product,
            ),
          };
        },
      );

      queryClient.setQueriesData<ApiResponse>(
        { queryKey: productsQueryKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((product) =>
              product.id === productId
                ? {
                    ...product,
                    description_override: descriptionOverride,
                  }
                : product,
            ),
          };
        },
      );

      queryClient.setQueriesData<Product>(
        { queryKey: productQueryKeys.detailsForProduct(productId) },
        (oldData) =>
          oldData
            ? {
                ...oldData,
                description_override: descriptionOverride,
              }
            : oldData,
      );

      return { previousAdminLists, previousLists, previousDetails };
    },
    onError: (_error, _variables, context) => {
      context?.previousAdminLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      context?.previousDetails.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (response, variables) => {
      const persistedOverride = normalizeDescriptionOverride(
        response.description_override !== undefined
          ? response.description_override
          : variables.descriptionOverride,
      );

      queryClient.setQueriesData<AdminProductsResponse>(
        { queryKey: adminProductsQueryKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((product) =>
              product.id === variables.productId
                ? withDescriptionOverride(product, persistedOverride)
                : product,
            ),
          };
        },
      );

      queryClient.setQueriesData<ApiResponse>(
        { queryKey: productsQueryKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((product) =>
              product.id === variables.productId
                ? {
                    ...product,
                    description_override: persistedOverride,
                  }
                : product,
            ),
          };
        },
      );

      queryClient.setQueriesData<Product>(
        { queryKey: productQueryKeys.detailsForProduct(variables.productId) },
        (oldData) =>
          oldData
            ? {
                ...oldData,
                description_override: persistedOverride,
              }
            : oldData,
      );
    },
  });
}
