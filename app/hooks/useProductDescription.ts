import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "~/types";
import { productsQueryKeys } from "~/lib/products-query";
import type { ApiProductDescriptionActionData } from "~/types/routes";

type UpdateProductDescriptionPayload = {
  productId: number;
  descriptionOverride: string | null;
};

type OptimisticContext = {
  previousLists: Array<readonly [readonly unknown[], ApiResponse | undefined]>;
};

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
      await queryClient.cancelQueries({ queryKey: productsQueryKeys.lists() });

      const previousLists = queryClient.getQueriesData<ApiResponse>({
        queryKey: productsQueryKeys.lists(),
      });

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

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (response, variables) => {
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
                    description_override:
                      response.description_override ??
                      variables.descriptionOverride,
                  }
                : product,
            ),
          };
        },
      );
    },
  });
}
