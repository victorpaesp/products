import type { QueryClient } from "@tanstack/react-query";
import type { ApiResponse, Product } from "~/types";

export type ProductsQueryParams = {
  page: number;
  perPage: number;
  search?: string;
  color?: number;
  sortType: "name" | "price";
  sortOrder: "asc" | "desc";
};

export function getProductsQueryParams(
  searchParams: URLSearchParams,
): ProductsQueryParams {
  const page = Number(searchParams.get("page")) || 1;
  const perPage = Number(searchParams.get("per_page")) || 48;

  const search = searchParams.get("q")?.trim() || undefined;
  const colorParam = searchParams.get("color");
  const color =
    colorParam && !Number.isNaN(Number(colorParam))
      ? Number(colorParam)
      : undefined;

  const sortName = searchParams.get("sort[name]");
  const sortPrice = searchParams.get("sort[price]");

  if (sortPrice === "asc" || sortPrice === "desc") {
    return {
      page,
      perPage,
      search,
      color,
      sortType: "price",
      sortOrder: sortPrice,
    };
  }

  return {
    page,
    perPage,
    search,
    color,
    sortType: "name",
    sortOrder: sortName === "desc" ? "desc" : "asc",
  };
}

export function toProductsApiParams(
  params: ProductsQueryParams,
): URLSearchParams {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("per_page", String(params.perPage));

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.color) {
    query.set("colors", String(params.color));
  }

  if (params.sortType === "name") {
    query.set("sort[name]", params.sortOrder);
  } else {
    query.set("sort[price]", params.sortOrder);
  }

  return query;
}

export const productsQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productsQueryKeys.all, "list"] as const,
  list: (params: ProductsQueryParams) =>
    [...productsQueryKeys.lists(), params] as const,
};

/** Campos de especificação ainda ausentes na API de detalhe — preenchidos pela listagem. */
export function mergeProductSpecsFromListing(
  detail: Product,
  listing?: Product,
): Product {
  if (!listing) return detail;

  return {
    ...detail,
    fiscal_classification_type:
      detail.fiscal_classification_type ||
      listing.fiscal_classification_type,
    fiscal_classification_code:
      detail.fiscal_classification_code ||
      listing.fiscal_classification_code,
    product_weight: detail.product_weight || listing.product_weight,
    product_mention: detail.product_mention || listing.product_mention,
    quantity_box: detail.quantity_box ?? listing.quantity_box,
    box_weight: detail.box_weight || listing.box_weight,
    box_mention: detail.box_mention || listing.box_mention,
  };
}

export function findProductInListCache(
  queryClient: QueryClient,
  productId: string | number,
): Product | undefined {
  const entries = queryClient.getQueriesData<ApiResponse>({
    queryKey: productsQueryKeys.lists(),
  });

  for (const [, data] of entries) {
    const product = data?.data?.find(
      (item) => String(item.id) === String(productId),
    );
    if (product) return product;
  }

  return undefined;
}
