export type ProductsQueryParams = {
  page: number;
  perPage: number;
  search?: string;
  color?: number;
  supplierId?: number;
  category?: string;
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

  const supplierIdParam = searchParams.get("supplier_id");
  const supplierId =
    supplierIdParam && !Number.isNaN(Number(supplierIdParam))
      ? Number(supplierIdParam)
      : undefined;

  const category = searchParams.get("category")?.trim() || undefined;

  const sortName = searchParams.get("sort[name]");
  const sortPrice = searchParams.get("sort[price]");

  if (sortPrice === "asc" || sortPrice === "desc") {
    return {
      page,
      perPage,
      search,
      color,
      supplierId,
      category,
      sortType: "price",
      sortOrder: sortPrice,
    };
  }

  return {
    page,
    perPage,
    search,
    color,
    supplierId,
    category,
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

  if (params.supplierId) {
    query.set("supplier_id", String(params.supplierId));
  }

  if (params.category) {
    query.set("category", params.category);
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
