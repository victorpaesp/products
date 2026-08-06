import type {
  AdminProductListItem,
  AdminProductsResponse,
  ApiResponse,
  Product,
} from "~/types";
import {
  getOriginalProductDescription,
  hasProductDescriptionOverride,
} from "~/lib/product-description";
import type { ProductsQueryParams } from "~/lib/products-query";
import { getSupplierDisplayName } from "~/lib/utils";

export const adminProductsQueryKeys = {
  all: ["admin-products"] as const,
  lists: () => [...adminProductsQueryKeys.all, "list"] as const,
  list: (params: ProductsQueryParams) =>
    [...adminProductsQueryKeys.lists(), params] as const,
};

export function toAdminProductListItem(product: Product): AdminProductListItem {
  const hasOriginalDescription = Boolean(
    getOriginalProductDescription(product),
  );
  const hasManualDescription = hasProductDescriptionOverride(product);

  return {
    id: product.id,
    product_cod: product.product_cod,
    name: product.name,
    thumbnail: product.image?.trim() || null,
    supplier: {
      id: product.supplier?.id ?? 0,
      name: getSupplierDisplayName(product.supplier) || "",
    },
    description_source: hasManualDescription ? "manual" : "supplier",
    has_description: hasManualDescription || hasOriginalDescription,
    has_original_description: hasOriginalDescription,
    updated_at: product.updated_at,
    categories: product.categories ?? [],
  };
}

export function toAdminProductsResponse(
  response: ApiResponse,
): AdminProductsResponse {
  return {
    ...response,
    data: response.data.map(toAdminProductListItem),
  };
}
