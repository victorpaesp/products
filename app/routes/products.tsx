import {
  useLoaderData,
  useOutletContext,
  useRouteLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { data, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useEffect, useMemo, useState } from "react";
import type { ApiResponse, Product, SelectedProduct } from "~/types";
import { ProductCard } from "~/components/features/products/ProductCard";
import { CategoriesFilter } from "~/components/features/products/CategoriesFilter";
import { CategoryBreadcrumb } from "~/components/features/products/CategoryBreadcrumb";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "~/components/ui/combobox";
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
import { useColorsQuery } from "~/hooks/useColors";
import { useSuppliersQuery } from "~/hooks/useSuppliers";
import { useCategoriesQuery } from "~/hooks/useCategories";
import { buildCategoryIndex } from "~/lib/categories";
import { BackendApiError } from "~/lib/backend.server";
import { useCacheStatus } from "~/hooks/useCacheStatus";
import { CacheIndicator } from "~/components/shared/CacheIndicator";
import { BackToTopButton } from "~/components/shared/BackToTopButton";
import type { loader as rootLoader } from "~/root";

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
      token,
    });
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      throw redirect("/login");
    }

    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao carregar os produtos.";

    return data<ProductsLoaderData>(
      {
        data: null,
        error: message,
        token,
      },
      { status: 500 },
    );
  }
}

export const meta: MetaFunction = () => {
  return [{ title: "Santo Mimo" }];
};

export function shouldRevalidate({
  currentUrl,
  nextUrl,
}: {
  currentUrl: URL;
  nextUrl: URL;
}) {
  return currentUrl.search !== nextUrl.search;
}

export default function Products() {
  const loaderData = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const isAdmin = rootData?.user?.role === "admin";
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const searchTermRaw = searchParams.get("q");
  const searchTerm = searchTermRaw ? searchTermRaw.trim() : "";
  const queryParams = useMemo(() => {
    const params = getProductsQueryParams(searchParams);
    if (!isAdmin) {
      return { ...params, supplierId: undefined };
    }
    return params;
  }, [searchParams, isAdmin]);

  const { data, isLoading, isFetching, isError, error } = useProductsQuery(
    queryParams,
    { token: loaderData.token },
  );

  const cacheStatus = useCacheStatus({ data, isLoading, isFetching });

  const errorMessage = isError
    ? error.message || "Erro ao carregar os produtos."
    : !data
      ? loaderData.error
      : null;

  const isProductsGridLoading = isFetching && !errorMessage;
  const selectedColor = searchParams.get("color") || "";
  const selectedSupplierId = searchParams.get("supplier_id") || "";
  const selectedCategorySlug = searchParams.get("category")?.trim() || "";
  const { data: colors = [] } = useColorsQuery(loaderData.token);
  const { data: suppliers = [] } = useSuppliersQuery(loaderData.token, {
    enabled: isAdmin,
  });
  const categoriesQuery = useCategoriesQuery(loaderData.token);
  const categories = useMemo(
    () => (Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []),
    [categoriesQuery.data],
  );
  const categoryIndex = useMemo(
    () => buildCategoryIndex(categories),
    [categories],
  );
  const selectedCategory = selectedCategorySlug
    ? (categoryIndex.bySlug.get(selectedCategorySlug) ?? null)
    : null;
  const selectedCategoryPath = selectedCategorySlug
    ? categoryIndex.pathsBySlug.get(selectedCategorySlug)
    : undefined;

  type ColorOption = { id: string; name: string };
  type SupplierOption = { id: string; name: string };

  const colorOptions = useMemo<ColorOption[]>(
    () =>
      colors.map((color) => ({
        id: String(color.id),
        name: color.name,
      })),
    [colors],
  );

  const supplierOptions = useMemo<SupplierOption[]>(
    () =>
      suppliers.map((supplier) => ({
        id: String(supplier.id),
        name: supplier.name,
      })),
    [suppliers],
  );

  const [selectedColorOption, setSelectedColorOption] =
    useState<ColorOption | null>(null);

  const [selectedSupplierOption, setSelectedSupplierOption] =
    useState<SupplierOption | null>(null);

  useEffect(() => {
    if (!selectedColor) {
      setSelectedColorOption(null);
      return;
    }

    setSelectedColorOption(
      colorOptions.find((option) => option.id === selectedColor) ?? null,
    );
  }, [selectedColor]);

  useEffect(() => {
    if (!selectedColor) return;

    setSelectedColorOption((current) => {
      if (current?.id === selectedColor) return current;
      return (
        colorOptions.find((option) => option.id === selectedColor) ?? current
      );
    });
  }, [colorOptions, selectedColor]);

  useEffect(() => {
    if (!isAdmin || !selectedSupplierId) {
      setSelectedSupplierOption(null);
      return;
    }

    setSelectedSupplierOption(
      supplierOptions.find((option) => option.id === selectedSupplierId) ??
        null,
    );
  }, [isAdmin, selectedSupplierId, supplierOptions]);

  useEffect(() => {
    if (isAdmin || !searchParams.has("supplier_id")) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("supplier_id");
    setSearchParams(nextSearchParams, { replace: true });
  }, [isAdmin, searchParams, setSearchParams]);

  const pendingSearchParams = useMemo(() => searchParams, [searchParams]);

  const hasNextPage = Boolean(data?.next_page_url);

  useEffect(() => {
    if (!hasNextPage) return;
    if (data?.current_page !== queryParams.page) return;

    const nextParams: ProductsQueryParams = {
      ...queryParams,
      page: queryParams.page + 1,
    };

    void queryClient.prefetchQuery({
      queryKey: productsQueryKeys.list(nextParams),
      queryFn: () => fetchProductsQuery(nextParams, loaderData.token),
    });
  }, [
    hasNextPage,
    data?.current_page,
    queryClient,
    queryParams,
    loaderData.token,
  ]);

  const page = Number(searchParams.get("page")) || 1;
  const showProductsSection = Boolean(data || errorMessage);
  const {
    selectedProducts,
    setSelectedProducts,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useOutletContext<ProductsOutletContextType>();
  const perPage =
    data?.per_page ?? (Number(searchParams.get("per_page")) || 48);

  const handleCategoryChange = (slug: string | null) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (slug) {
      newSearchParams.set("category", slug);
    } else {
      newSearchParams.delete("category");
    }
    newSearchParams.set("page", "1");
    setSearchParams(newSearchParams);
  };

  let sortType: "name" | "price" = "name";
  let sortOrder: "asc" | "desc" = "asc";
  if (searchParams.get("sort[name]")) {
    sortType = "name";
    sortOrder = searchParams.get("sort[name]") as "asc" | "desc";
  } else if (searchParams.get("sort[price]")) {
    sortType = "price";
    sortOrder = searchParams.get("sort[price]") as "asc" | "desc";
  }

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
        return [
          ...prev,
          { product, variation, colorFiltered: Boolean(queryParams.color) },
        ];
      }
    });
  };

  function getSelectLabelWithIcon(value: string) {
    if (value.startsWith("name")) {
      return (
        <span className="flex items-center gap-2">
          {value.endsWith("asc") ? (
            <ArrowDownAZ className="size-4 shrink-0" />
          ) : (
            <ArrowUpAZ className="size-4 shrink-0" />
          )}
          Nome
        </span>
      );
    }
    if (value.startsWith("price")) {
      return (
        <span className="flex items-center gap-2">
          {value.endsWith("asc") ? (
            <ArrowDown01 className="size-4 shrink-0" />
          ) : (
            <ArrowUp01 className="size-4 shrink-0" />
          )}
          Preço
        </span>
      );
    }
    return "Selecione...";
  }

  return (
    <section className="sm-container">
      <CacheIndicator status={cacheStatus} />
      <div>
        {showProductsSection ? (
          <div className="mb-8 flex flex-wrap items-end gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-4">
              <CategoriesFilter
                categories={categories}
                selectedCategory={selectedCategory}
                selectedSlug={selectedCategorySlug}
                isLoading={categoriesQuery.isLoading}
                isError={categoriesQuery.isError}
                errorMessage={categoriesQuery.error?.message}
                isAdmin={isAdmin}
                onSelect={handleCategoryChange}
                onRetry={() => {
                  void categoriesQuery.refetch();
                }}
              />
              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto">
                <label
                  htmlFor="color-select"
                  className="mb-1 text-sm whitespace-nowrap sm:mb-0"
                >
                  Filtrar por cor:
                </label>
                <Combobox
                  items={colorOptions}
                  itemToStringLabel={(option) => option.name}
                  isItemEqualToValue={(a, b) => a.id === b.id}
                  value={selectedColorOption}
                  onValueChange={(option) => {
                    setSelectedColorOption(option);
                    const newSearchParams = new URLSearchParams(searchParams);
                    if (!option) {
                      newSearchParams.delete("color");
                    } else {
                      newSearchParams.set("color", option.id);
                    }
                    newSearchParams.set("page", "1");
                    setSearchParams(newSearchParams);
                  }}
                >
                  <ComboboxInput
                    id="color-select"
                    placeholder="Selecione"
                    className="w-full sm:w-48"
                    showClear={Boolean(selectedColorOption)}
                  />
                  <ComboboxContent className="max-h-62 min-w-[calc(100%+28px)]">
                    <ComboboxEmpty>Nenhuma cor encontrada.</ComboboxEmpty>
                    <ComboboxList>
                      {(option) => (
                        <ComboboxItem key={option.id} value={option}>
                          {option.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
              {isAdmin && (
                <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto">
                  <label
                    htmlFor="supplier-select"
                    className="mb-1 text-sm whitespace-nowrap sm:mb-0"
                  >
                    Filtrar por fornecedor:
                  </label>
                  <Combobox
                    items={supplierOptions}
                    itemToStringLabel={(option) => option.name}
                    isItemEqualToValue={(a, b) => a.id === b.id}
                    value={selectedSupplierOption}
                    onValueChange={(option) => {
                      setSelectedSupplierOption(option);
                      const newSearchParams = new URLSearchParams(searchParams);
                      if (!option) {
                        newSearchParams.delete("supplier_id");
                      } else {
                        newSearchParams.set("supplier_id", option.id);
                      }
                      newSearchParams.set("page", "1");
                      setSearchParams(newSearchParams);
                    }}
                  >
                    <ComboboxInput
                      id="supplier-select"
                      placeholder="Selecione"
                      className="w-full sm:w-48"
                      showClear={Boolean(selectedSupplierOption)}
                    />
                    <ComboboxContent className="max-h-62 min-w-[calc(100%+28px)]">
                      <ComboboxEmpty>
                        Nenhum fornecedor encontrado.
                      </ComboboxEmpty>
                      <ComboboxList>
                        {(option) => (
                          <ComboboxItem key={option.id} value={option}>
                            {option.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              )}
            </div>

            {/* Ordenar por */}
            <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto">
              <label
                htmlFor="sort-select"
                className="text-sm whitespace-nowrap"
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
                <SelectTrigger
                  id="sort-select"
                  disableFocusRing
                  className="w-auto min-w-36 justify-center border-0 bg-transparent px-1 shadow-none focus:border-transparent"
                >
                  <SelectValue>
                    {getSelectLabelWithIcon(`${sortType}-${sortOrder}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">
                    <span className="flex items-center gap-2">
                      <ArrowDownAZ className="size-4 shrink-0" />
                      Nome: A-Z
                    </span>
                  </SelectItem>
                  <SelectItem value="name-desc">
                    <span className="flex items-center gap-2">
                      <ArrowUpAZ className="size-4 shrink-0" />
                      Nome: Z-A
                    </span>
                  </SelectItem>
                  <SelectItem value="price-asc">
                    <span className="flex items-center gap-2">
                      <ArrowDown01 className="size-4 shrink-0" />
                      Preço: Menor ao maior
                    </span>
                  </SelectItem>
                  <SelectItem value="price-desc">
                    <span className="flex items-center gap-2">
                      <ArrowUp01 className="size-4 shrink-0" />
                      Preço: Maior ao menor
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
        {searchTerm ? (
          <h1 className="mb-5 text-2xl font-bold">
            Resultados para: {searchTerm}
          </h1>
        ) : null}
        {showProductsSection && selectedCategorySlug ? (
          <CategoryBreadcrumb
            path={selectedCategoryPath}
            isLoading={categoriesQuery.isLoading}
            onSelect={handleCategoryChange}
          />
        ) : null}
        {showProductsSection && (
          <>
            <ProductsPagination
              page={page}
              perPage={perPage}
              total={data?.total ?? 0}
              from={data?.from}
              to={data?.to}
              lastPage={data?.last_page}
              searchParams={pendingSearchParams}
              setSearchParams={setSearchParams}
              className="mb-8"
              top
            />
            {errorMessage ? (
              <div className="flex h-64 items-center justify-center">
                <ErrorState message={errorMessage} />
              </div>
            ) : isProductsGridLoading ? (
              <LoadingState />
            ) : !data || data.data.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <EmptyState message="Nenhum produto encontrado" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:gap-8 lg:grid-cols-4">
                {data.data.map((product, index) => {
                  const selectedVariations = selectedProducts
                    .filter(
                      (p) => p.product.product_cod === product.product_cod,
                    )
                    .map((p) => p.variation.product_cod);
                  return (
                    <div
                      key={`product.product_cod-${product.product_cod}-${index}-${product.name}`}
                      className="flex h-full w-full min-w-0"
                    >
                      <ProductCard
                        product={product}
                        selectedVariations={selectedVariations}
                        onSelect={toggleSelectProduct}
                        preferVariationImage={Boolean(queryParams.color)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <ProductsPagination
              page={page}
              perPage={perPage}
              total={data?.total ?? 0}
              from={data?.from}
              to={data?.to}
              lastPage={data?.last_page}
              searchParams={pendingSearchParams}
              setSearchParams={setSearchParams}
              className="mt-8"
            />
          </>
        )}
        {isLoading && !data && !errorMessage && <LoadingState />}
      </div>
      <BackToTopButton />
    </section>
  );
}
