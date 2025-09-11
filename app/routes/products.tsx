import { useSearchParams } from "@remix-run/react";
import { useEffect, useState, useRef, useCallback } from "react";
import type { ApiResponse, Product } from "~/types";
import { api } from "~/lib/axios";
import { ProductCard } from "~/components/ProductCard";
import { SearchBar } from "~/components/SearchBar";
import { SelectedProductsDrawer } from "~/components/SelectedProductsDrawer";
import { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Santo Mimo" }];
};

export default function Products() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q");
  const observer = useRef<IntersectionObserver | null>(null);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [sortAsc, setSortAsc] = useState(true);
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
      const perPage = searchParams.get("per_page") || "12";

      setLoading(true);
      api
        .get<ApiResponse>("/dados", {
          params: {
            productName: searchTerm,
            page,
            per_page: perPage,
            sort_by: "name",
            order: sortAsc ? "asc" : "desc",
          },
        })
        .then((response) => {
          setData((prev) => {
            if (!prev) return response.data;
            return {
              ...response.data,
              data: [...prev.data, ...response.data.data],
            };
          });
        })
        .finally(() => setLoading(false));
    }
  }, [searchTerm, searchParams, page, sortAsc]); // adiciona sortAsc como dependência

  return (
    <div>
      <SearchBar
        onSearch={(data) => {
          setData(data);
          setPage(1);
        }}
        onLoading={setLoading}
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
          <button
            onClick={() => {
              setSortAsc((prev) => !prev);
              setPage(1);
              setData(null); // Reseta os dados para recarregar a lista
            }}
            className="ml-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-700 transition"
          >
            {sortAsc ? "Ordem A-Z" : "Ordem Z-A"}
          </button>
        </div>
        {loading && <div className="text-center">Carregando...</div>}
        {data && (
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
