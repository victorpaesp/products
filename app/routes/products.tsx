import { useSearchParams } from "@remix-run/react";
import { useEffect, useState, useRef, useCallback } from "react";
import type { ApiResponse } from "~/types";
import { api } from "~/lib/axios";
import { ProductCard } from "~/components/ProductCard";
import { SearchBar } from "~/components/SearchBar";

export default function Products() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastProductRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && data?.next_page_url) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, data?.next_page_url]);

  useEffect(() => {
    if (searchTerm) {
      const perPage = searchParams.get("per_page") || "12";

      setLoading(true);
      api.get<ApiResponse>("/dados", {
        params: {
          productName: searchTerm,
          page,
          per_page: perPage,
        },
      })
        .then(response => {
          setData(prev => {
            if (!prev) return response.data;
            return {
              ...response.data,
              data: [...prev.data, ...response.data.data],
            };
          });
        })
        .finally(() => setLoading(false));
    }
  }, [searchTerm, searchParams, page]);

  return (
    <div>
      <SearchBar onSearch={setData} onLoading={setLoading} />
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-2xl font-bold mb-8">
          Resultados para: {searchTerm}
        </h1>
        {loading && (
          <div className="text-center">Carregando...</div>
        )}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.data.map((product, index) => (
              <div
                key={product.ProductCod}
                ref={index === data.data.length - 1 ? lastProductRef : undefined}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
