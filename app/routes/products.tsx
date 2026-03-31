import {
  useLoaderData,
  useOutletContext,
  useSearchParams,
} from "@remix-run/react";
import { data, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useEffect, useMemo, useState } from "react";
import type { ApiResponse, Product, SelectedProduct } from "~/types";
import { ProductCard } from "~/components/features/products/ProductCard";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ProductsPagination } from "~/components/features/products/ProductsPagination";
import { ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01 } from "lucide-react";
import { EmptyState } from "~/components/shared/EmptyState";
import { ErrorState } from "~/components/shared/ErrorState";
import { LoadingState } from "~/components/shared/LoadingState";
import { MetaFunction } from "@remix-run/node";
import { requireAuth } from "~/lib/auth.server";
import { useQueryClient } from "@tanstack/react-query";
import { createQueryClient } from "~/lib/query-client";
import { fetchProductsForRequest } from "~/lib/products.server";
import type {
  ProductsLoaderData,
  ProductsOutletContextType,
} from "~/types/routes";
import {
  getProductsQueryParams,
  productsQueryKeys,
  type ProductsQueryParams,
  toProductsApiParams,
} from "~/lib/products-query";
import { fetchProductsQuery, useProductsQuery } from "~/hooks/useProducts";
import { BackendApiError } from "~/lib/backend.server";
import { useCacheStatus } from "~/hooks/useCacheStatus";
import { CacheIndicator } from "~/components/shared/CacheIndicator";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireAuth(request);
  const url = new URL(request.url);
  const queryParams = getProductsQueryParams(url.searchParams);
  const params = toProductsApiParams(queryParams);
  const queryClient = createQueryClient();
  const queryKey = productsQueryKeys.list(queryParams);

  try {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () =>
        fetchProductsForRequest({
          token,
          params,
        }),
    });

    const prefetchedData = queryClient.getQueryData<ApiResponse>(queryKey);

    return data<ProductsLoaderData>({
      data: prefetchedData || null,
      error: null,
    });
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      throw redirect("/login");
    }

    return data<ProductsLoaderData>(
      {
        data: null,
        error: "Erro ao carregar os produtos.",
      },
      { status: 500 },
    );
  }
}

export const meta: MetaFunction = () => {
  return [{ title: "Santo Mimo" }];
};

export function shouldRevalidate() {
  return false;
}

export default function Products() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const searchTermRaw = searchParams.get("q");
  const searchTerm = searchTermRaw ? searchTermRaw.trim() : "";
  const queryParams = getProductsQueryParams(searchParams);

  const { data, isLoading, isFetching, isError, error } =
    useProductsQuery(queryParams);

  const cacheStatus = useCacheStatus({ data, isLoading, isFetching } as any);

  const errorMessage =
    loaderData.error ||
    (isError ? error.message || "Erro ao carregar os produtos." : null);

  const isProductsRevalidatingRaw = isFetching && !isLoading;
  const [showProductsRevalidating, setShowProductsRevalidating] =
    useState(false);
  const variationSearch = searchParams.get("variation_search") || "";
  const [variationSearchInput, setVariationSearchInput] =
    useState(variationSearch);

  const pendingSearchParams = useMemo(() => searchParams, [searchParams]);

  useEffect(() => {
    if (!variationSearch) setVariationSearchInput("");
  }, [variationSearch]);

  useEffect(() => {
    if (!isProductsRevalidatingRaw) {
      setShowProductsRevalidating(false);
      return;
    }

    const showDelay = setTimeout(() => {
      setShowProductsRevalidating(true);
    }, 120);

    return () => {
      clearTimeout(showDelay);
    };
  }, [isProductsRevalidatingRaw]);

  useEffect(() => {
    if (!data?.pagination?.has_more_pages) return;

    const nextParams: ProductsQueryParams = {
      ...queryParams,
      page: queryParams.page + 1,
    };

    void queryClient.prefetchQuery({
      queryKey: productsQueryKeys.list(nextParams),
      queryFn: () => fetchProductsQuery(nextParams),
    });
  }, [data?.pagination?.has_more_pages, queryClient, queryParams]);

  const page = Number(searchParams.get("page")) || 1;
  const {
    selectedProducts,
    setSelectedProducts,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useOutletContext<ProductsOutletContextType>();
  const perPage = Number(searchParams.get("per_page")) || 48;

  let sortType: "name" | "price" = "name";
  let sortOrder: "asc" | "desc" = "asc";
  if (searchParams.get("sort[name]")) {
    sortType = "name";
    sortOrder = searchParams.get("sort[name]") as "asc" | "desc";
  } else if (searchParams.get("sort[price]")) {
    sortType = "price";
    sortOrder = searchParams.get("sort[price]") as "asc" | "desc";
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("selectedProducts");
    if (saved) {
      try {
        setSelectedProducts(JSON.parse(saved));
      } catch (error) {
        console.error("Erro ao carregar produtos selecionados:", error);
        sessionStorage.removeItem("selectedProducts");
      }
    }
  }, []);

  useEffect(() => {
    const value = JSON.stringify(selectedProducts);
    sessionStorage.setItem("selectedProducts", value);
  }, [selectedProducts]);

  const toggleSelectProduct = (
    product: Product,
    variation: Product["variations"][0],
  ) => {
    setSelectedProducts((prev: SelectedProduct[]) => {
      const isSelected = prev.some(
        (p) =>
          p.product.product_cod === product.product_cod &&
          p.variation.product_cod === variation.product_cod,
      );
      if (isSelected) {
        return prev.filter(
          (p) =>
            !(
              p.product.product_cod === product.product_cod &&
              p.variation.product_cod === variation.product_cod
            ),
        );
      } else {
        return [...prev, { product, variation }];
      }
    });
  };

  function getSelectLabelWithIcon(value: string) {
    if (value.startsWith("name")) {
      return (
        <>
          {value.endsWith("asc") ? (
            <ArrowDownAZ className="mr-2 h-4 w-4 inline" />
          ) : (
            <ArrowUpAZ className="mr-2 h-4 w-4 inline" />
          )}
          Nome
        </>
      );
    }
    if (value.startsWith("price")) {
      return (
        <>
          {value.endsWith("asc") ? (
            <ArrowDown01 className="mr-2 h-4 w-4 inline" />
          ) : (
            <ArrowUp01 className="mr-2 h-4 w-4 inline" />
          )}
          Preço
        </>
      );
    }
    return "Selecione...";
  }

  return (
    <div>
      <CacheIndicator status={cacheStatus} />
      <div
        className={`container mx-auto px-4 py-8 sm:mt-[82px] ${
          selectedProducts.length > 0 ? "mt-[122px]" : "mt-[74px]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-betweenm mb-14 gap-4">
          {searchTerm && (
            <h1 className="text-2xl font-bold">
              Resultados para: {searchTerm}
            </h1>
          )}
          {data && data.data.length > 0 && (
            <div className="flex flex-col sm:flex-row ml-auto items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="flex gap-4">
                {/* Ordenar por */}
                <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto">
                  <label
                    htmlFor="sort-select"
                    className="text-sm whitespace-nowrap mb-1 sm:mb-0"
                  >
                    Ordenar por:
                  </label>
                  <Select
                    value={`${sortType}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [type, order] = value.split("-");
                      const newSearchParams = new URLSearchParams(searchParams);
                      newSearchParams.delete("sort[name]");
                      newSearchParams.delete("sort[price]");
                      if (type === "name") {
                        newSearchParams.set("sort[name]", order);
                      } else if (type === "price") {
                        newSearchParams.set("sort[price]", order);
                      }
                      newSearchParams.set("page", "1");
                      setSearchParams(newSearchParams);
                    }}
                  >
                    <SelectTrigger id="sort-select" className="w-full sm:w-40">
                      <SelectValue>
                        {getSelectLabelWithIcon(`${sortType}-${sortOrder}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">
                        <ArrowDownAZ className="mr-2 h-4 w-4 inline" />
                        Nome: A-Z
                      </SelectItem>
                      <SelectItem value="name-desc">
                        <ArrowUpAZ className="mr-2 h-4 w-4 inline" />
                        Nome: Z-A
                      </SelectItem>
                      <SelectItem value="price-asc">
                        <ArrowDown01 className="mr-2 h-4 w-4 inline" />
                        Preço: Menor ao maior
                      </SelectItem>
                      <SelectItem value="price-desc">
                        <ArrowUp01 className="mr-2 h-4 w-4 inline" />
                        Preço: Maior ao menor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Campo de pesquisa para variação */}
              <div className="flex flex-col items-stretch gap-2 w-full">
                <label
                  htmlFor="variation-search"
                  className="text-sm whitespace-nowrap mb-1 sm:mb-0"
                >
                  Pesquisar variação:
                </label>
                <div className="flex gap-2">
                  <Input
                    id="variation-search"
                    type="text"
                    placeholder="Digite a variação..."
                    value={variationSearchInput}
                    className="w-full"
                    onChange={(e) => setVariationSearchInput(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      const newSearchParams = new URLSearchParams(searchParams);
                      if (variationSearchInput.trim()) {
                        newSearchParams.set(
                          "variation_search",
                          variationSearchInput,
                        );
                      } else {
                        newSearchParams.delete("variation_search");
                      }
                      newSearchParams.set("page", "1");
                      setSearchParams(newSearchParams);
                    }}
                    disabled={!variationSearchInput.trim()}
                  >
                    Pesquisar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        {showProductsRevalidating && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600">
            <span className="inline-block size-2 animate-pulse rounded-full bg-gray-500" />
            Atualizando resultados...
          </div>
        )}
        {errorMessage && (
          <div className="flex justify-center items-center h-64">
            <ErrorState message={errorMessage} />
          </div>
        )}
        {!errorMessage && data && data.data.length === 0 && (
          <div className="flex justify-center items-center h-64">
            <EmptyState message="Nenhum produto encontrado" />
          </div>
        )}
        {!errorMessage && data && data.data.length > 0 && (
          <>
            <ProductsPagination
              page={page}
              perPage={perPage}
              data={{ total: data.pagination.total }}
              searchParams={pendingSearchParams}
              setSearchParams={setSearchParams}
              className="mb-8"
            />
            <div className="relative">
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity ${
                  showProductsRevalidating ? "opacity-50" : "opacity-100"
                }`}
              >
                {data.data.map((product, index) => {
                  const selectedVariations = selectedProducts
                    .filter(
                      (p) => p.product.product_cod === product.product_cod,
                    )
                    .map((p) => p.variation.product_cod);
                  return (
                    <div
                      key={`product.product_cod-${product.product_cod}-${index}-${product.name}`}
                      className="h-full flex"
                    >
                      <ProductCard
                        product={product}
                        selectedVariations={selectedVariations}
                        onSelect={toggleSelectProduct}
                      />
                    </div>
                  );
                })}
              </div>
              {showProductsRevalidating && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-md bg-white/90 px-4 py-3 shadow">
                    <LoadingState compact />
                  </div>
                </div>
              )}
            </div>
            <ProductsPagination
              page={page}
              perPage={perPage}
              data={{ total: data.pagination.total }}
              searchParams={pendingSearchParams}
              setSearchParams={setSearchParams}
              className="mt-8"
            />
          </>
        )}
        {isLoading && !data && <LoadingState />}
      </div>
    </div>
  );
}
