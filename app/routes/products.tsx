import { useSearchParams } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { useEffect, useState } from "react";
import type { ApiResponse, Product } from "~/types";
import { api } from "~/lib/axios";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { ProductCard } from "~/components/ProductCard";
import { useOutletContext } from "@remix-run/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ProductsPagination } from "../components/ProductsPagination";
import { ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01 } from "lucide-react";
import { EmptyState } from "~/components/shared/EmptyState";
import { ErrorState } from "~/components/shared/ErrorState";
import { LoadingState } from "~/components/shared/LoadingState";
import { MetaFunction } from "@remix-run/node";
import { removeHtmlTags } from "~/lib/utils";
import { useAuth } from "~/hooks/useAuth";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  return null;
}

export const meta: MetaFunction = () => {
  return [{ title: "Santo Mimo" }];
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const searchTermRaw = searchParams.get("q");
  const searchTerm = searchTermRaw ? searchTermRaw.trim() : "";

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const page = Number(searchParams.get("page")) || 1;
  type OutletContextType = {
    selectedProducts: Product[];
    setSelectedProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    isDrawerOpen: boolean;
    setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
  const {
    selectedProducts,
    setSelectedProducts,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useOutletContext<OutletContextType>();
  const perPage = Number(searchParams.get("per_page")) || 12;

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

  const toogleSelectProduct = (product: Product) => {
    setSelectedProducts((prev: Product[]) => {
      const isSelected = prev.some(
        (p: Product) => p.product_cod === product.product_cod
      );
      if (isSelected) {
        return prev.filter(
          (p: Product) => p.product_cod !== product.product_cod
        );
      } else {
        return [...prev, product];
      }
    });
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    setData(null);
    setError(null);
    setLoading(true);
    const params: Record<string, unknown> = {
      page: page,
      per_page: perPage,
    };
    if (searchTerm) {
      params["search"] = searchTerm;
    }
    const allowedSortFields = ["name", "price"];
    const sortParams: Record<string, "asc" | "desc"> = {};
    allowedSortFields.forEach((field) => {
      const value = searchParams.get(`sort[${field}]`);
      if (value === "asc" || value === "desc") {
        sortParams[field] = value;
      }
    });
    if (Object.keys(sortParams).length > 0) {
      Object.entries(sortParams).forEach(([field, direction]) => {
        params[`sort[${field}]`] = direction;
      });
    } else {
      params["sort[name]"] = "asc";
    }
    api
      .get<ApiResponse>("/products", { params })
      .then((response) => {
        const cleanData = {
          ...response.data,
          data: response.data.data.map((product) => ({
            ...product,
            description: removeHtmlTags(product.description),
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
      .catch((error) => {
        setData(null);
        setError("Error");
        console.error("Erro ao buscar produtos:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    searchTerm,
    page,
    perPage,
    sortType,
    sortOrder,
    authLoading,
    isAuthenticated,
  ]);

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
    <ProtectedRoute>
      <div>
        <div
          className={`container mx-auto px-4 py-8 sm:mt-[82px] ${
            selectedProducts.length > 0 ? "mt-[122px]" : "mt-[74px]"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            {searchTerm && (
              <h1 className="text-2xl font-bold">
                Resultados para: {searchTerm}
              </h1>
            )}
            {data && data.data.length > 0 && (
              <div className="flex flex-col ml-auto sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
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
            )}
          </div>
          {error && (
            <div className="flex justify-center items-center h-64">
              <ErrorState message="Erro ao carregar os produtos." />
            </div>
          )}
          {!error && data && data.data.length === 0 && (
            <div className="flex justify-center items-center h-64">
              <EmptyState message="Nenhum produto encontrado" />
            </div>
          )}
          {!error && data && data.data.length > 0 && (
            <>
              <ProductsPagination
                page={page}
                perPage={perPage}
                data={{ total: data.pagination.total }}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
                setData={setData}
                className="mb-8"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.data.map((product, index) => (
                  <div
                    key={`product.product_cod-${product.product_cod}-${index}-${product.name}`}
                    className="h-full flex"
                  >
                    <ProductCard
                      product={product}
                      isSelected={selectedProducts.some(
                        (p) => p.product_cod === product.product_cod
                      )}
                      onSelect={toogleSelectProduct}
                    />
                  </div>
                ))}
              </div>
              <ProductsPagination
                page={page}
                perPage={perPage}
                data={{ total: data.pagination.total }}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
                setData={setData}
                className="mt-8"
              />
            </>
          )}
          {loading && <LoadingState />}
        </div>
      </div>
    </ProtectedRoute>
  );
}
