import { LoaderCircle, Save, Search, Tags, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/ui/input-group";
import { toast } from "~/components/ui/toast-client";
import { useCategoriesQuery } from "~/hooks/useCategories";
import {
  useProductCategoriesQuery,
  useSaveProductCategoriesMutation,
} from "~/hooks/useProductCategories";
import type { ProductCategory } from "~/types";

type CategoryOption = { id: string; name: string; path: string };

function flattenCategories(
  categories: ProductCategory[],
  parentNames: string[] = [],
): CategoryOption[] {
  return categories.flatMap((category) => {
    const names = [...parentNames, category.name];
    const current =
      category.id === undefined
        ? []
        : [
            {
              id: String(category.id),
              name: category.name,
              path: names.join(" / "),
            },
          ];
    return [...current, ...flattenCategories(category.children, names)];
  });
}

function sameIds(left: Set<string>, right: Set<string>) {
  return left.size === right.size && [...left].every((id) => right.has(id));
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type ProductCategoriesSectionProps = {
  productId: string | number;
  token: string;
  onDirtyChange: (dirty: boolean) => void;
};

export function ProductCategoriesSection({
  productId,
  token,
  onDirtyChange,
}: ProductCategoriesSectionProps) {
  const categoriesQuery = useCategoriesQuery(token);
  const productCategoriesQuery = useProductCategoriesQuery(productId);
  const mutation = useSaveProductCategoriesMutation(productId);
  const options = useMemo(
    () => flattenCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const savedIds = useMemo(
    () =>
      new Set(
        (productCategoriesQuery.data ?? []).map(({ category }) => category.id),
      ),
    [productCategoriesQuery.data],
  );
  const [draftIds, setDraftIds] = useState<Set<string> | null>(null);
  const [search, setSearch] = useState("");
  const selectedIds = draftIds ?? savedIds;
  const loaded = productCategoriesQuery.data !== undefined;
  const dirty = loaded && !sameIds(selectedIds, savedIds);
  const optionById = useMemo(() => {
    const map = new Map(options.map((option) => [option.id, option]));
    for (const { category } of productCategoriesQuery.data ?? []) {
      if (!map.has(category.id)) {
        map.set(category.id, {
          id: category.id,
          name: category.name,
          path: category.parent
            ? `${category.parent.name} / ${category.name}`
            : category.name,
        });
      }
    }
    return map;
  }, [options, productCategoriesQuery.data]);
  const selectedOptions = useMemo(
    () =>
      [...selectedIds].flatMap((id) => {
        const option = optionById.get(id);
        return option ? [option] : [];
      }),
    [optionById, selectedIds],
  );
  const filteredOptions = useMemo(() => {
    const term = normalizeSearchText(search.trim());
    if (!term) return options;
    return options.filter((option) =>
      normalizeSearchText(option.path).includes(term),
    );
  }, [options, search]);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const toggle = (categoryId: string, checked: boolean) => {
    setDraftIds(() => {
      const next = new Set(selectedIds);
      if (checked) next.add(categoryId);
      else next.delete(categoryId);
      return next;
    });
  };

  const save = async () => {
    try {
      await mutation.mutateAsync({
        currentIds: [...savedIds],
        selectedIds: [...selectedIds],
      });
      setDraftIds(null);
      toast.success("Categorias atualizadas.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as categorias.",
      );
    }
  };

  const loading = categoriesQuery.isLoading || productCategoriesQuery.isLoading;
  const error =
    categoriesQuery.error?.message || productCategoriesQuery.error?.message;

  return (
    <section
      aria-labelledby="product-categories-title"
      className="rounded-lg border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Tags className="text-muted-foreground size-4" aria-hidden="true" />
            <h4 id="product-categories-title" className="font-semibold">
              Categorias
            </h4>
            {loaded ? (
              <Badge variant="outline">{selectedIds.size}</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">
            Marque para adicionar ou trocar. Desmarque para remover.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void save()}
          disabled={!dirty || mutation.isPending}
        >
          {mutation.isPending ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          {mutation.isPending ? "Salvando..." : "Salvar categorias"}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Carregando categorias...
        </p>
      ) : error ? (
        <p className="text-destructive mt-4 text-sm" role="alert">
          {error}
        </p>
      ) : options.length ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Selecionadas</p>
            {selectedOptions.length ? (
              <div
                className="bg-muted/40 flex flex-wrap gap-2 rounded-md border p-3"
                aria-live="polite"
              >
                {selectedOptions.map((option) => (
                  <Badge
                    key={option.id}
                    variant="secondary"
                    className="max-w-full gap-1 pr-1"
                  >
                    <span className="truncate">{option.path}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => toggle(option.id, false)}
                      disabled={mutation.isPending}
                      aria-label={`Remover categoria ${option.name}`}
                    >
                      <X />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                Nenhuma categoria selecionada.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="category-search" className="text-sm font-medium">
              Buscar categoria
            </label>
            <InputGroup className="h-10">
              <InputGroupAddon align="inline-start">
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id="category-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite o nome da categoria..."
                disabled={mutation.isPending}
              />
              {search ? (
                <InputGroupAddon align="inline-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSearch("")}
                    aria-label="Limpar busca"
                  >
                    <X />
                  </Button>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
          </div>

          {filteredOptions.length ? (
            <fieldset className="grid max-h-64 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
              <legend className="sr-only">Categorias disponíveis</legend>
              {filteredOptions.map((option) => {
                const checkboxId = `product-category-${option.id}`;
                return (
                  <label
                    key={option.id}
                    htmlFor={checkboxId}
                    className="hover:bg-muted flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selectedIds.has(option.id)}
                      onCheckedChange={(checked) =>
                        toggle(option.id, checked === true)
                      }
                      disabled={mutation.isPending}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">{option.name}</span>
                      {option.path !== option.name ? (
                        <span className="text-muted-foreground block truncate text-xs">
                          {option.path}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ) : (
            <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
              Nenhuma categoria encontrada. Tente buscar por outro nome.
            </p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">
          Nenhuma categoria disponível.
        </p>
      )}
    </section>
  );
}
