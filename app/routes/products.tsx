import { useSearchParams } from "@remix-run/react";
import { useEffect, useState, useRef, useCallback } from "react";
import type { ApiResponse, Product } from "~/types";
import { api } from "~/lib/axios";
import { ProductCard } from "~/components/ProductCard";
import { SearchBar } from "~/components/SearchBar";
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
          setSelectedProducts([]);
        }}
        onLoading={setLoading}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
      />
      <div className="container mx-auto px-4 py-8 mt-20">
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
                <ProductCard product={product} onSelect={toogleSelectProduct} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
