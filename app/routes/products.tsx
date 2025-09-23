import { useSearchParams } from "@remix-run/react";
import { useEffect, useState, useRef, useCallback } from "react";
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
import { ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01 } from "lucide-react";
import { SelectedProductsDrawer } from "~/components/SelectedProductsDrawer";
import { EmptyState } from "~/components/ui/EmptyState";
import { LoadingState } from "~/components/ui/LoadingState";
import { MetaFunction } from "@remix-run/node";
import { removeHtmlTags } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [{ title: "Santo Mimo" }];
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("q");
  const observer = useRef<IntersectionObserver | null>(null);
  const prevSearchTerm = useRef<string | null>(null);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const [sortType, setSortType] = useState<"name" | "price">(() => {
    if (searchParams.get("name_sort")) return "name";
    if (searchParams.get("price_sort")) return "price";
    return "name";
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() => {
    return (searchParams.get("name_sort") ||
      searchParams.get("price_sort") ||
      "asc") as "asc" | "desc";
  });

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

  useEffect(() => {
    const nameSort = searchParams.get("name_sort");
    const priceSort = searchParams.get("price_sort");
    if (nameSort) {
      setSortType("name");
      setSortOrder(nameSort as "asc" | "desc");
    } else if (priceSort) {
      setSortType("price");
      setSortOrder(priceSort as "asc" | "desc");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && data?.next_page_url) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, data?.next_page_url]
  );

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
      const isNewSearch = prevSearchTerm.current !== searchTerm;

      if (isNewSearch) {
        setData(null);
        prevSearchTerm.current = searchTerm;
        if (page !== 1) {
          setPage(1);
          return;
        }
      }

      setLoading(true);
      const params: Record<string, any> = {
        productName: searchTerm,
        page: page,
        per_page: searchParams.get("per_page") || "12",
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
  }, [searchTerm, page, sortType, sortOrder]);

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Resultados para: {searchTerm}</h1>
          {data && data.data.length > 0 && (
            <div className="flex items-center gap-2">
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
                  setSortType(type as "name" | "price");
                  setSortOrder(order as "asc" | "desc");
                  setPage(1);
                  setData(null);
                  const newSearchParams = new URLSearchParams(searchParams);
                  if (type === "name") {
                    newSearchParams.delete("price_sort");
                    newSearchParams.set("name_sort", order);
                  } else if (type === "price") {
                    newSearchParams.delete("name_sort");
                    newSearchParams.set("price_sort", order);
                  }
                  setSearchParams(newSearchParams);
                }}
              >
                <SelectTrigger id="sort-select">
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
          )}
        </div>
        {data && data.data.length === 0 && (
          <div className="flex justify-center items-center h-64">
            <EmptyState message="Nenhum produto encontrado" />
          </div>
        )}
        {data && data.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.data.map((product, index) => (
              <div
                key={`product.ProductCod-${product.ProductCod}-${index}-${product.Name}`}
                ref={
                  index === data.data.length - 1 ? lastProductRef : undefined
                }
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
