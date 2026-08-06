import {
  data,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AdminProductsTable } from "~/components/features/admin/products/AdminProductsTable";
import { AdminProductEditor } from "~/components/features/admin/products/editor/AdminProductEditor";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useAdminProductsQuery } from "~/hooks/useAdminProducts";
import { useSuppliersQuery } from "~/hooks/useSuppliers";
import { requireAdminSession } from "~/lib/auth.server";
import { getProductsQueryParams } from "~/lib/products-query";

export const meta: MetaFunction = () => [
  { title: "Produtos · Administração — Santo Mimo" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { token } = await requireAdminSession(request);

  return data({ token });
}

type ProductSearchFormProps = {
  value: string;
  onSearch: (value: string) => void;
};

function ProductSearchForm({ value, onSearch }: ProductSearchFormProps) {
  const [draft, setDraft] = useState(value);

  return (
    <form
      className="flex w-full min-w-0 gap-2 lg:max-w-md"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft);
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Buscar por nome ou código..."
          aria-label="Buscar produtos por nome ou código"
          className="h-10 pl-9"
        />
      </div>
      <Button type="submit" variant="outline" className="h-10">
        Buscar
      </Button>
    </form>
  );
}

function parseSelectedProductId(value: string | null): string | null {
  const productId = value?.trim() ?? "";
  return /^(?:\d+|[a-f0-9]{24})$/i.test(productId) ? productId : null;
}

export default function AdminProductsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParams = useMemo(
    () => getProductsQueryParams(searchParams),
    [searchParams],
  );
  const productsQuery = useAdminProductsQuery(queryParams);
  const suppliersQuery = useSuppliersQuery(loaderData.token);
  const selectedProductId = parseSelectedProductId(searchParams.get("product"));
  const products = productsQuery.data?.data ?? [];
  const currentPage = productsQuery.data?.current_page ?? queryParams.page;
  const lastPage = productsQuery.data?.last_page ?? 1;
  const total = productsQuery.data?.total ?? 0;
  const from = productsQuery.data?.from ?? 0;
  const to = productsQuery.data?.to ?? 0;
  const errorMessage = productsQuery.error?.message ?? null;
  const sortValue = `${queryParams.sortType}-${queryParams.sortOrder}`;
  const hasFilters =
    Boolean(queryParams.search) ||
    Boolean(queryParams.supplierId) ||
    sortValue !== "name-asc";

  const updateSearchParams = (
    updates: Record<string, string | null>,
    options?: { preserveProduct?: boolean },
  ) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });

    if (!options?.preserveProduct) next.delete("product");
    setSearchParams(next);
  };

  const changePage = (page: number) => {
    updateSearchParams({ page: String(page) }, { preserveProduct: false });
  };

  const openProduct = (productId: string | number) => {
    updateSearchParams(
      { product: String(productId) },
      { preserveProduct: true },
    );
  };

  const closeProduct = () => {
    updateSearchParams({ product: null }, { preserveProduct: true });
  };

  const clearFilters = () => {
    updateSearchParams({
      q: null,
      supplier_id: null,
      "sort[name]": null,
      "sort[price]": null,
      page: "1",
    });
  };

  return (
    <section
      aria-labelledby="admin-products-title"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 id="admin-products-title" className="text-2xl font-bold">
            Produtos
          </h1>
          <Badge variant="outline" className="tabular-nums">
            {total} {total === 1 ? "produto" : "produtos"}
          </Badge>
          {productsQuery.isFetching && productsQuery.data ? (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <LoaderCircle className="size-3.5 animate-spin" />
              Atualizando
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Localize produtos e gerencie as informações que substituem os dados
          recebidos dos fornecedores.
        </p>
      </div>

      <div className="border-border bg-card flex flex-col gap-4 rounded-lg border p-4 shadow-xs">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <ProductSearchForm
            key={queryParams.search ?? ""}
            value={queryParams.search ?? ""}
            onSearch={(value) =>
              updateSearchParams({
                q: value.trim() || null,
                page: "1",
              })
            }
          />

          <div className="grid gap-3 sm:grid-cols-3 xl:ml-auto xl:flex xl:w-auto">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-product-supplier"
                className="text-muted-foreground text-xs font-medium"
              >
                Fornecedor
              </label>
              <Select
                value={
                  queryParams.supplierId
                    ? String(queryParams.supplierId)
                    : "all"
                }
                onValueChange={(value) =>
                  updateSearchParams({
                    supplier_id: value === "all" ? null : value,
                    page: "1",
                  })
                }
              >
                <SelectTrigger
                  id="admin-product-supplier"
                  className="h-10 min-w-44"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todos</SelectItem>
                    {(suppliersQuery.data ?? []).map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.name || supplier.alias}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-product-sort"
                className="text-muted-foreground text-xs font-medium"
              >
                Ordenação
              </label>
              <Select
                value={sortValue}
                onValueChange={(value) => {
                  const [, order] = value.split("-");
                  updateSearchParams({
                    "sort[name]": order,
                    "sort[price]": null,
                    page: "1",
                  });
                }}
              >
                <SelectTrigger
                  id="admin-product-sort"
                  className="h-10 min-w-44"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="name-asc">
                      <span className="flex items-center gap-2">
                        <ArrowDownAZ className="size-4" />
                        Nome: A–Z
                      </span>
                    </SelectItem>
                    <SelectItem value="name-desc">
                      <span className="flex items-center gap-2">
                        <ArrowUpAZ className="size-4" />
                        Nome: Z–A
                      </span>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-products-per-page"
                className="text-muted-foreground text-xs font-medium"
              >
                Por página
              </label>
              <Select
                value={String(queryParams.perPage)}
                onValueChange={(value) =>
                  updateSearchParams({
                    per_page: value,
                    page: "1",
                  })
                }
              >
                <SelectTrigger
                  id="admin-products-per-page"
                  className="h-10 min-w-28"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[24, 48, 96].map((amount) => (
                      <SelectItem key={amount} value={String(amount)}>
                        {amount}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {hasFilters ? (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X data-icon="inline-start" />
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </div>

      {productsQuery.isLoading && !productsQuery.data ? (
        <div className="flex min-h-72 items-center justify-center gap-2">
          <LoaderCircle className="size-5 animate-spin" />
          <span className="text-muted-foreground text-sm">
            Carregando produtos...
          </span>
        </div>
      ) : errorMessage ? (
        <div
          className="border-border bg-card flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border p-6 text-center"
          role="alert"
        >
          <div className="flex max-w-md flex-col gap-1">
            <p className="font-semibold">
              Não foi possível carregar os produtos
            </p>
            <p className="text-muted-foreground text-sm">{errorMessage}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => void productsQuery.refetch()}
          >
            <RotateCw data-icon="inline-start" />
            Tentar novamente
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="border-border bg-card flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center">
          <div className="flex max-w-md flex-col gap-1">
            <p className="font-semibold">Nenhum produto encontrado</p>
            <p className="text-muted-foreground text-sm">
              Revise os filtros ou busque usando outro nome ou código.
            </p>
          </div>
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <AdminProductsTable
          products={products}
          selectedProductId={selectedProductId}
          onEdit={openProduct}
        />
      )}

      {productsQuery.data && total > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm tabular-nums">
            Mostrando {from}–{to} de {total}
          </p>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1 || productsQuery.isFetching}
            >
              <ChevronLeft data-icon="inline-start" />
              Anterior
            </Button>
            <span className="min-w-24 text-center text-sm tabular-nums">
              {currentPage} de {lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= lastPage || productsQuery.isFetching}
            >
              Próxima
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      ) : null}

      {selectedProductId ? (
        <AdminProductEditor
          key={selectedProductId}
          productId={selectedProductId}
          token={loaderData.token}
          onClose={closeProduct}
        />
      ) : null}
    </section>
  );
}
