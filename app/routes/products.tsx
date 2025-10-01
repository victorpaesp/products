import { useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import type { ApiResponse, Product } from "~/types";
import { api } from "~/lib/axios";
import { ProductCard } from "~/components/ProductCard";
import { SearchBar } from "~/components/SearchBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "~/components/ui/pagination";
import { ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01 } from "lucide-react";
import { SelectedProductsDrawer } from "~/components/SelectedProductsDrawer";
import { EmptyState } from "~/components/shared/EmptyState";
import { LoadingState } from "~/components/shared/LoadingState";
import { MetaFunction } from "@remix-run/node";
import { removeHtmlTags } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [{ title: "Santo Mimo" }];
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("q");

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const page = Number(searchParams.get("page")) || 1;
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const perPage = Number(searchParams.get("per_page")) || 12;

  const sortType: "name" | "price" = (() => {
    if (searchParams.get("name_sort")) return "name";
    if (searchParams.get("price_sort")) return "price";
    return "name";
  })();

  const sortOrder: "asc" | "desc" = (searchParams.get("name_sort") ||
    searchParams.get("price_sort") ||
    "asc") as "asc" | "desc";

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const toogleSelectProduct = (product: Product) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some((p) => p.ProductCod === product.ProductCod);
      if (isSelected) {
        return prev.filter((p) => p.ProductCod !== product.ProductCod);
      } else {
        return [...prev, product];
      }
    });
  };

  const removeProduct = (productCod: string) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.ProductCod !== productCod)
    );
  };

  const clearSelectedProducts = () => {
    setSelectedProducts([]);
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    if (searchTerm) {
      setData(null);
      setLoading(true);
      const params: Record<string, unknown> = {
        productName: searchTerm,
        page: page,
        per_page: perPage,
      };
      if (sortType === "name") {
        params["name_sort"] = sortOrder;
      } else if (sortType === "price") {
        params["price_sort"] = sortOrder;
      }
      api
        .get<ApiResponse>("/dados", { params })
        .then((response) => {
          const cleanData = {
            ...response.data,
            data: response.data.data.map((product) => ({
              ...product,
              Description: removeHtmlTags(product.Description),
            })),
          };
          setData((prev) => {
            if (!prev || page === 1) return cleanData;
            return {
              ...cleanData,
              data: [...prev.data, ...cleanData.data],
            };
          });
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page, sortType, sortOrder, perPage]);

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
      <SearchBar
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />
      <div
        className={`container mx-auto px-4 py-8 ${
          selectedProducts.length > 0
            ? "mt-[202px] sm:mt-[82px]"
            : "mt-[142px] sm:mt-[82px]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold">Resultados para: {searchTerm}</h1>
          {data && data.data.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <label
                  htmlFor="per-page-select"
                  className="text-sm whitespace-nowrap mb-1 sm:mb-0"
                >
                  Itens por página:
                </label>
                <Select
                  value={String(perPage)}
                  onValueChange={(value) => {
                    setData(null);
                    const newSearchParams = new URLSearchParams(searchParams);
                    newSearchParams.set("per_page", value);
                    newSearchParams.set("page", "1");
                    setSearchParams(newSearchParams);
                  }}
                >
                  <SelectTrigger
                    id="per-page-select"
                    className="w-full sm:w-24"
                  >
                    <SelectValue>{perPage}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
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
                    setData(null);
                    const newSearchParams = new URLSearchParams(searchParams);
                    if (type === "name") {
                      newSearchParams.delete("price_sort");
                      newSearchParams.set("name_sort", order);
                    } else if (type === "price") {
                      newSearchParams.delete("name_sort");
                      newSearchParams.set("price_sort", order);
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
          )}
        </div>
        {data && data.data.length === 0 && (
          <div className="flex justify-center items-center h-64">
            <EmptyState message="Nenhum produto encontrado" />
          </div>
        )}
        {data && data.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.data.map((product, index) => (
                <div
                  key={`product.ProductCod-${product.ProductCod}-${index}-${product.Name}`}
                >
                  <ProductCard
                    product={product}
                    isSelected={selectedProducts.some(
                      (p) => p.ProductCod === product.ProductCod
                    )}
                    onSelect={toogleSelectProduct}
                  />
                </div>
              ))}
            </div>
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) {
                        const newSearchParams = new URLSearchParams(
                          searchParams
                        );
                        newSearchParams.set("page", String(page - 1));
                        setSearchParams(newSearchParams);
                        setData(null);
                      }
                    }}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {(() => {
                  const pageCount = data?.total
                    ? Math.ceil(data.total / perPage)
                    : 1;
                  const items = [];
                  const start = Math.max(1, page - 2);
                  const end = Math.min(pageCount, page + 2);
                  if (start > 1) {
                    items.push(
                      <PaginationItem key={1}>
                        <PaginationLink
                          href="#"
                          isActive={page === 1}
                          onClick={(e) => {
                            e.preventDefault();
                            const newSearchParams = new URLSearchParams(
                              searchParams
                            );
                            newSearchParams.set("page", "1");
                            setSearchParams(newSearchParams);
                            setData(null);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    );
                    if (start > 2) {
                      items.push(
                        <PaginationItem key="start-ellipsis">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                  }
                  for (let p = start; p <= end; p++) {
                    items.push(
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={page === p}
                          onClick={(e) => {
                            e.preventDefault();
                            const newSearchParams = new URLSearchParams(
                              searchParams
                            );
                            newSearchParams.set("page", String(p));
                            setSearchParams(newSearchParams);
                            setData(null);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (end < pageCount) {
                    if (end < pageCount - 1) {
                      items.push(
                        <PaginationItem key="end-ellipsis">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    items.push(
                      <PaginationItem key={pageCount}>
                        <PaginationLink
                          href="#"
                          isActive={page === pageCount}
                          onClick={(e) => {
                            e.preventDefault();
                            const newSearchParams = new URLSearchParams(
                              searchParams
                            );
                            newSearchParams.set("page", String(pageCount));
                            setSearchParams(newSearchParams);
                            setData(null);
                          }}
                        >
                          {pageCount}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return items;
                })()}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      const pageCount = data?.total
                        ? Math.ceil(data.total / perPage)
                        : 1;
                      if (page < pageCount) {
                        const newSearchParams = new URLSearchParams(
                          searchParams
                        );
                        newSearchParams.set("page", String(page + 1));
                        setSearchParams(newSearchParams);
                        setData(null);
                      }
                    }}
                    aria-disabled={
                      page ===
                      (data?.total ? Math.ceil(data.total / perPage) : 1)
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </>
        )}
        {loading && <LoadingState />}
      </div>

      <SelectedProductsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedProducts={selectedProducts}
        onRemoveProduct={removeProduct}
        onClearProducts={clearSelectedProducts}
      />
    </div>
  );
}
