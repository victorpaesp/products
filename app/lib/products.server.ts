import type { ApiResponse } from "~/types";
import { removeHtmlTags } from "~/lib/utils";
import { backendListProducts } from "~/lib/backend.server";

export async function fetchProductsForRequest(options: {
  token: string;
  params: URLSearchParams;
}): Promise<ApiResponse> {
  const response = await backendListProducts({
    token: options.token,
    params: options.params,
  });

  return {
    ...response,
    data: response.data.map((product) => ({
      ...product,
      description: removeHtmlTags(product.description),
    })),
  };
}
