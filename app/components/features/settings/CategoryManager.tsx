import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import type { AdminCategory, CategoryUpsertPayload } from "~/types";
import {
  useAdminCategoriesQuery,
  useDeleteCategoryMutation,
  useUpsertCategoryMutation,
} from "~/hooks/useCategories";
import { normalizeCategoryKeywordText } from "~/lib/categories";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Textarea } from "~/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Separator } from "~/components/ui/separator";
import { toast } from "~/components/ui/toast-client";
import { CategoryKeywordsDialog } from "~/components/features/settings/CategoryKeywordsDialog";
import { cn } from "~/lib/utils";

type CategoryRow = {
  category: AdminCategory;
  depth: number;
  path: string[];
};

type CategoryDialogData = {
  category: AdminCategory | null;
  parentId: number | null;
};

type KeywordDraft = {
  id: number;
  keyword: string;
  weight: number;
};

function flattenCategories(categories: AdminCategory[]): CategoryRow[] {
  const rows: CategoryRow[] = [];

  const visit = (
    category: AdminCategory,
    depth: number,
    parentPath: string[],
  ) => {
    const path = [...parentPath, category.name];
    rows.push({ category, depth, path });
    category.children.forEach((child) => visit(child, depth + 1, path));
  };

  categories.forEach((category) => visit(category, 0, []));
  return rows;
}

function collectDescendantIds(category: AdminCategory): Set<number> {
  const ids = new Set<number>();

  const visit = (item: AdminCategory) => {
    item.children.forEach((child) => {
      ids.add(child.id);
      visit(child);
    });
  };

  visit(category);
  return ids;
}

function countDescendants(category: AdminCategory): number {
  return category.children.reduce(
    (total, child) => total + 1 + countDescendants(child),
    0,
  );
}

type CategoryFormDialogProps = {
  state: CategoryDialogData;
  rows: CategoryRow[];
  onOpenChange: (open: boolean) => void;
};

function CategoryFormDialog({
  state,
  rows,
  onOpenChange,
}: CategoryFormDialogProps) {
  const [name, setName] = useState(state.category?.name ?? "");
  const [description, setDescription] = useState(
    state.category?.description ?? "",
  );
  const [parentId, setParentId] = useState<number | null>(
    state.category?.parent_id ?? state.parentId,
  );
  const [active, setActive] = useState(state.category?.active ?? true);
  const [keywords, setKeywords] = useState<KeywordDraft[]>([
    { id: 1, keyword: "", weight: 1 },
  ]);
  const [formError, setFormError] = useState("");
  const mutation = useUpsertCategoryMutation();
  const category = state.category;
  const isEdit = category !== null;
  const canChangeParent = !category || category.children.length === 0;

  const excludedIds = useMemo(() => {
    if (!category) return new Set<number>();
    const ids = collectDescendantIds(category);
    ids.add(category.id);
    return ids;
  }, [category]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError("Informe o nome da categoria.");
      return;
    }

    const normalizedKeywords = isEdit
      ? undefined
      : keywords.map(({ keyword, weight }) => ({
          keyword: normalizeCategoryKeywordText(keyword),
          weight,
        }));

    if (normalizedKeywords?.some(({ keyword }) => !keyword)) {
      setFormError("Preencha todas as palavras-chave.");
      return;
    }

    if (
      normalizedKeywords?.some(
        ({ weight }) => !Number.isInteger(weight) || weight < 1 || weight > 5,
      )
    ) {
      setFormError("O peso de cada palavra-chave deve estar entre 1 e 5.");
      return;
    }

    if (
      normalizedKeywords &&
      new Set(normalizedKeywords.map(({ keyword }) => keyword)).size !==
        normalizedKeywords.length
    ) {
      setFormError("Não repita palavras-chave na mesma categoria.");
      return;
    }

    const payload: CategoryUpsertPayload = {
      name: trimmedName,
      parent_id: parentId,
      description: description.trim() || null,
      active,
      keywords: normalizedKeywords,
    };

    try {
      await mutation.mutateAsync({ categoryId: category?.id, body: payload });
      onOpenChange(false);
      toast.success(
        isEdit
          ? "Categoria atualizada com sucesso."
          : "Categoria criada com sucesso.",
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a categoria.",
      );
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize a organização e a visibilidade desta categoria."
              : "Crie uma categoria principal ou associe-a a uma categoria principal existente."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="category-form"
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="category-name" className="text-sm font-medium">
              Nome
            </label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setFormError("");
              }}
              maxLength={255}
              aria-invalid={Boolean(formError && !name.trim())}
              required
            />
            <p className="text-muted-foreground text-xs">
              O slug será gerado automaticamente pela API.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="category-parent" className="text-sm font-medium">
              Categoria pai
            </label>
            <Select
              value={parentId === null ? "root" : String(parentId)}
              disabled={!canChangeParent}
              onValueChange={(value) =>
                setParentId(value === "root" ? null : Number(value))
              }
            >
              <SelectTrigger id="category-parent" className="w-full">
                <SelectValue placeholder="Selecione a categoria pai" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="root">
                    Nenhuma · categoria principal
                  </SelectItem>
                  {rows
                    .filter(
                      ({ category: item, depth }) =>
                        depth === 0 && !excludedIds.has(item.id),
                    )
                    .map(({ category: item }) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {canChangeParent
                ? "Somente categorias principais podem receber subcategorias."
                : "Categorias que possuem filhas devem permanecer como principais."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="category-description"
              className="text-sm font-medium"
            >
              Descrição{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24"
              placeholder="Explique quais produtos pertencem a esta categoria."
            />
          </div>

          {!isEdit ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Palavras-chave</p>
                  <p className="text-muted-foreground text-xs">
                    Use pesos de 1 a 5 para indicar a relevância de cada termo.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setKeywords((current) => [
                      ...current,
                      {
                        id:
                          current.reduce(
                            (highestId, item) => Math.max(highestId, item.id),
                            0,
                          ) + 1,
                        keyword: "",
                        weight: 1,
                      },
                    ]);
                    setFormError("");
                  }}
                >
                  <Plus data-icon="inline-start" />
                  Adicionar
                </Button>
              </div>

              {keywords.map((item, index) => (
                <div
                  key={item.id}
                  className="border-border grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:items-end"
                >
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`category-keyword-${item.id}`}
                      className="text-sm font-medium"
                    >
                      Palavra-chave {index + 1}
                    </label>
                    <Input
                      id={`category-keyword-${item.id}`}
                      value={item.keyword}
                      onChange={(event) => {
                        const keyword = event.target.value;
                        setKeywords((current) =>
                          current.map((currentItem) =>
                            currentItem.id === item.id
                              ? { ...currentItem, keyword }
                              : currentItem,
                          ),
                        );
                        setFormError("");
                      }}
                      maxLength={100}
                      placeholder="Ex.: Café da Tarde"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`category-keyword-weight-${item.id}`}
                      className="text-sm font-medium"
                    >
                      Peso
                    </label>
                    <Select
                      value={String(item.weight)}
                      onValueChange={(value) => {
                        const weight = Number(value);
                        setKeywords((current) =>
                          current.map((currentItem) =>
                            currentItem.id === item.id
                              ? { ...currentItem, weight }
                              : currentItem,
                          ),
                        );
                        setFormError("");
                      }}
                    >
                      <SelectTrigger
                        id={`category-keyword-weight-${item.id}`}
                        className="w-full"
                        aria-label={`Peso da palavra-chave ${index + 1}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {[1, 2, 3, 4, 5].map((weight) => (
                            <SelectItem key={weight} value={String(weight)}>
                              {weight}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={keywords.length === 1}
                    aria-label={`Remover palavra-chave ${index + 1}`}
                    title="Remover palavra-chave"
                    onClick={() => {
                      setKeywords((current) =>
                        current.filter(
                          (currentItem) => currentItem.id !== item.id,
                        ),
                      );
                      setFormError("");
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <label
            htmlFor="category-active"
            className="border-border flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2"
          >
            <Checkbox
              id="category-active"
              checked={active}
              onCheckedChange={(checked) => setActive(checked === true)}
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium">Categoria ativa</span>
              <span className="text-muted-foreground text-xs">
                Categorias inativas não aparecem no menu de filtros.
              </span>
            </span>
          </label>

          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="category-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : null}
            {mutation.isPending ? "Salvando..." : "Salvar categoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryManager() {
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [dialogState, setDialogState] = useState<CategoryDialogData | null>(
    null,
  );
  const [categoryToDelete, setCategoryToDelete] =
    useState<AdminCategory | null>(null);
  const [keywordDialogCategory, setKeywordDialogCategory] =
    useState<AdminCategory | null>(null);
  const query = useAdminCategoriesQuery();
  const deleteMutation = useDeleteCategoryMutation();
  const categories = useMemo(() => query.data ?? [], [query.data]);
  const rows = useMemo(() => flattenCategories(categories), [categories]);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

  const visibleRows = useMemo(() => {
    if (normalizedSearch) {
      return rows.filter(({ category, path }) =>
        [
          category.name,
          category.slug,
          category.description ?? "",
          path.join(" "),
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch),
      );
    }

    const hiddenDepths: number[] = [];
    return rows.filter((row) => {
      while (
        hiddenDepths.length > 0 &&
        row.depth <= hiddenDepths[hiddenDepths.length - 1]
      ) {
        hiddenDepths.pop();
      }

      const hidden = hiddenDepths.length > 0;
      if (
        row.category.children.length > 0 &&
        !expandedIds.has(row.category.id)
      ) {
        hiddenDepths.push(row.depth);
      }
      return !hidden;
    });
  }, [expandedIds, normalizedSearch, rows]);

  const activeCount = rows.reduce(
    (total, row) => total + (row.category.active ? 1 : 0),
    0,
  );

  const toggleExpanded = (categoryId: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      setCategoryToDelete(null);
      toast.success("Categoria removida com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a categoria.",
      );
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">Gerenciar categorias</h2>
            {query.data ? (
              <>
                <Badge variant="outline">{rows.length} no total</Badge>
                <Badge variant="secondary">{activeCount} ativas</Badge>
              </>
            ) : null}
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Organize a hierarquia exibida no menu de produtos. Alterações salvas
            atualizam o filtro de categorias.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setDialogState({ category: null, parentId: null })}
        >
          <Plus data-icon="inline-start" />
          Nova categoria
        </Button>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <InputGroup className="h-10 sm:max-w-sm">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar categorias"
              aria-label="Buscar categorias"
            />
          </InputGroup>
          <p className="text-muted-foreground text-xs">
            Use “Adicionar subcategoria” para manter a hierarquia correta.
          </p>
        </div>

        <Separator />

        {query.isLoading ? (
          <div className="text-muted-foreground flex min-h-56 items-center justify-center gap-2 p-6 text-sm">
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Carregando categorias...
          </div>
        ) : query.isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-muted-foreground text-sm">
              {query.error.message ||
                "Não foi possível carregar as categorias."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
            >
              <RotateCw data-icon="inline-start" />
              Tentar novamente
            </Button>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <Folder className="text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-medium">
                {rows.length === 0
                  ? "Nenhuma categoria cadastrada"
                  : "Nenhuma categoria encontrada"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {rows.length === 0
                  ? "Crie a primeira categoria para iniciar a organização do catálogo."
                  : "Revise o termo usado na busca."}
              </p>
            </div>
            {rows.length === 0 ? (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setDialogState({ category: null, parentId: null })
                }
              >
                <Plus data-icon="inline-start" />
                Criar categoria
              </Button>
            ) : null}
          </div>
        ) : (
          <ul aria-label="Categorias cadastradas">
            {visibleRows.map(({ category, depth, path }, index) => {
              const hasChildren = category.children.length > 0;
              const expanded = expandedIds.has(category.id);

              return (
                <li
                  key={category.id}
                  className={cn(index > 0 && "border-border border-t")}
                >
                  <div className="hover:bg-muted/40 flex items-center gap-3 p-3.5 transition-colors sm:px-4">
                    <div
                      className="flex min-w-0 flex-1 items-center gap-2"
                      style={{ paddingLeft: `${Math.min(depth, 5) * 12}px` }}
                    >
                      {hasChildren && !normalizedSearch ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 sm:size-9"
                          aria-label={`${expanded ? "Recolher" : "Expandir"} ${category.name}`}
                          aria-expanded={expanded}
                          onClick={() => toggleExpanded(category.id)}
                        >
                          {expanded ? <ChevronDown /> : <ChevronRight />}
                        </Button>
                      ) : (
                        <span
                          className="size-11 shrink-0 sm:size-9"
                          aria-hidden="true"
                        />
                      )}

                      <div className="bg-muted hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex">
                        <Folder
                          aria-hidden="true"
                          className="text-muted-foreground"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium wrap-break-word">
                            {category.name}
                          </span>
                          <Badge
                            variant={category.active ? "default" : "secondary"}
                          >
                            {category.active ? "Ativa" : "Inativa"}
                          </Badge>
                          {hasChildren ? (
                            <Badge variant="outline">
                              {category.children.length}{" "}
                              {category.children.length === 1
                                ? "filha"
                                : "filhas"}
                            </Badge>
                          ) : null}
                          {category.keywords.length > 0 ? (
                            <Badge variant="outline">
                              {category.keywords.length}{" "}
                              {category.keywords.length === 1
                                ? "palavra-chave"
                                : "palavras-chave"}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground mt-1 truncate text-xs">
                          {category.slug}
                        </p>
                        {depth > 0 ? (
                          <p className="text-muted-foreground mt-1 truncate text-xs sm:hidden">
                            {path.slice(0, -1).join(" / ")}
                          </p>
                        ) : null}
                        {category.description ? (
                          <p className="text-muted-foreground mt-1 line-clamp-1 hidden text-sm md:block">
                            {category.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {depth === 0 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 sm:size-9"
                          aria-label={`Adicionar subcategoria em ${category.name}`}
                          title="Adicionar subcategoria"
                          onClick={() =>
                            setDialogState({
                              category: null,
                              parentId: category.id,
                            })
                          }
                        >
                          <FolderPlus />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 sm:size-9"
                        aria-label={`Editar palavras-chave de ${category.name}`}
                        title="Editar palavras-chave"
                        onClick={() => setKeywordDialogCategory(category)}
                      >
                        <Tags />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 sm:size-9"
                        aria-label={`Editar ${category.name}`}
                        title="Editar categoria"
                        onClick={() =>
                          setDialogState({
                            category,
                            parentId: category.parent_id,
                          })
                        }
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 sm:size-9"
                        aria-label={`Remover ${category.name}`}
                        title="Remover categoria"
                        onClick={() => setCategoryToDelete(category)}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {dialogState ? (
        <CategoryFormDialog
          key={
            dialogState.category?.id ?? `new-${dialogState.parentId ?? "root"}`
          }
          state={dialogState}
          rows={rows}
          onOpenChange={(open) => {
            if (!open) setDialogState(null);
          }}
        />
      ) : null}

      {keywordDialogCategory ? (
        <CategoryKeywordsDialog
          key={keywordDialogCategory.id}
          category={keywordDialogCategory}
          onOpenChange={(open) => {
            if (!open) setKeywordDialogCategory(null);
          }}
        />
      ) : null}

      <AlertDialog
        open={categoryToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setCategoryToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              “{categoryToDelete?.name}” será removida da listagem. Para uma
              alteração temporária, prefira editar e desativar a categoria.
              {categoryToDelete && countDescendants(categoryToDelete) > 0
                ? ` Esta categoria possui ${countDescendants(categoryToDelete)} subcategoria(s).`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleteMutation.isPending ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              {deleteMutation.isPending ? "Removendo..." : "Remover categoria"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
