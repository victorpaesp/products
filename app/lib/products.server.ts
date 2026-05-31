import type { ApiResponse, Link, Product } from "~/types";
import { removeHtmlTags } from "~/lib/utils";
import { backendGetProduct, backendListProducts } from "~/lib/backend.server";

type ListMeta = Omit<ApiResponse, "data" | "success" | "filters">;

const PAGINATION_FIELD_KEYS = [
  "current_page",
  "per_page",
  "total",
  "last_page",
  "from",
  "to",
  "next_page_url",
  "prev_page_url",
  "first_page_url",
  "last_page_url",
  "path",
  "links",
] as const;

function extractPaginationFields(
  source: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const pagination: Record<string, unknown> = {};

  for (const key of PAGINATION_FIELD_KEYS) {
    if (key in source) {
      pagination[key] = source[key];
    }
  }

  return Object.keys(pagination).length > 0 ? pagination : undefined;
}

function isLink(value: unknown): value is Link {
  return (
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    "active" in value
  );
}

function isProduct(value: unknown): value is Product {
  return (
    typeof value === "object" &&
    value !== null &&
    "product_cod" in value &&
    "name" in value
  );
}

function normalizeListMeta(
  source: Record<string, unknown> | undefined,
  productsCount: number,
): ListMeta {
  const currentPage = Number(source?.current_page) || 1;
  const perPage = Number(source?.per_page) || productsCount || 48;
  const total = Number(source?.total) ?? productsCount;
  const lastPage = Number(source?.last_page) || 1;

  return {
    current_page: currentPage,
    first_page_url:
      typeof source?.first_page_url === "string"
        ? source.first_page_url
        : null,
    from: Number(source?.from) || (productsCount > 0 ? 1 : 0),
    last_page: lastPage,
    last_page_url:
      typeof source?.last_page_url === "string" ? source.last_page_url : null,
    links: Array.isArray(source?.links)
      ? source.links.filter(isLink)
      : [],
    next_page_url:
      typeof source?.next_page_url === "string" ? source.next_page_url : null,
    path: typeof source?.path === "string" ? source.path : "",
    per_page: perPage,
    prev_page_url:
      typeof source?.prev_page_url === "string" ? source.prev_page_url : null,
    to: Number(source?.to) || productsCount,
    total,
  };
}

function normalizeProductsResponse(raw: unknown): ApiResponse {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida da API de produtos.");
  }

  const response = raw as Record<string, unknown>;
  let products: Product[] = [];
  let paginationSource: Record<string, unknown> | undefined;

  if (Array.isArray(response.data)) {
    products = response.data.filter(isProduct);
    paginationSource =
      typeof response.pagination === "object" && response.pagination !== null
        ? (response.pagination as Record<string, unknown>)
        : extractPaginationFields(response);
  } else if (
    response.data &&
    typeof response.data === "object" &&
    Array.isArray((response.data as { data?: unknown }).data)
  ) {
    const nested = response.data as Record<string, unknown> & {
      data: unknown[];
    };
    products = nested.data.filter(isProduct);
    paginationSource = nested;
  }

  const filters =
    typeof response.filters === "object" && response.filters !== null
      ? (response.filters as ApiResponse["filters"])
      : undefined;

  return {
    ...(typeof response.success === "boolean" ? { success: response.success } : {}),
    data: products,
    ...normalizeListMeta(paginationSource, products.length),
    ...(filters ? { filters } : {}),
  };
}

function mapProduct(product: Product): Product {
  return {
    ...product,
    description: removeHtmlTags(product.description ?? ""),
    gallery: product.gallery ?? [],
    variations: product.variations ?? [],
  };
}

function normalizeProductResponse(raw: unknown): Product {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida da API de produto.");
  }

  const response = raw as Record<string, unknown>;
  const candidate = response.data ?? response;

  if (!isProduct(candidate)) {
    throw new Error("Produto não encontrado.");
  }

  return mapProduct(candidate);
}

export async function fetchProductById(options: {
  token: string;
  productId: string | number;
  variationId?: string | number;
}): Promise<Product> {
  const response = await backendGetProduct({
    token: options.token,
    productId: options.productId,
    variationId: options.variationId,
  });

  return normalizeProductResponse(response);
}

export async function fetchProductsForRequest(options: {
  token: string;
  params: URLSearchParams;
}): Promise<ApiResponse> {
  const response = await backendListProducts({
    token: options.token,
    params: options.params,
  });

  const normalized = normalizeProductsResponse(response);

  return {
    ...normalized,
    data: normalized.data.map(mapProduct),
  };
}
