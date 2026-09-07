import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "@remix-run/react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleCheckBig,
  LoaderCircle,
  RotateCw,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import type { AdminCategory, CategoryReview } from "~/types";
import { useAdminCategoriesQuery } from "~/hooks/useCategories";
import {
  useApproveCategoryReviewMutation,
  useCategoryReviewsQuery,
  useRejectCategoryReviewMutation,
} from "~/hooks/useCategoryReviews";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import toast from "react-hot-toast";
import { AdminProductEditor } from "~/components/features/admin/products";

type CategoryOption = {
  id: number;
  label: string;
  active: boolean;
};

const REVIEW_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function flattenCategoryOptions(
  categories: AdminCategory[],
  parentPath: string[] = [],
): CategoryOption[] {
  return categories.flatMap((category) => {
    const path = [...parentPath, category.name];
    return [
      {
        id: category.id,
        label: path.join(" / "),
        active: category.active,
      },
      ...flattenCategoryOptions(category.children, path),
    ];
  });
}

function formatReviewDate(value: string): string {
  if (!value) return "Data não informada";

  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? "Data não informada"
    : REVIEW_DATE_FORMATTER.format(date);
}

type ReviewCardProps = {
  review: CategoryReview;
  categoryOptions: CategoryOption[];
  categoriesPending: boolean;
  onEditProduct: (productId: number) => void;
  onReject: (review: CategoryReview) => void;
};

function ReviewCard({
  review,
  categoryOptions,
  categoriesPending,
  onEditProduct,
  onReject,
}: ReviewCardProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    review.suggested_category ? String(review.suggested_category.id) : "",
  );
  const approveMutation = useApproveCategoryReviewMutation();
  const selectedCategoryExists = categoryOptions.some(
    (option) => option.active && String(option.id) === selectedCategoryId,
  );

  const handleApprove = async () => {
    if (!selectedCategoryId) return;

    try {
      await approveMutation.mutateAsync({
        reviewId: review.id,
        categoryId: Number(selectedCategoryId),
      });
      toast.success("Classificação aprovada com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível aprovar a classificação.",
      );
    }
  };

  const suggestedPath = review.suggested_category
    ? [review.suggested_category.parent, review.suggested_category.name]
        .filter(Boolean)
        .join(" / ")
    : "Sem categoria sugerida";

  return (
    <article className="border-border bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Score {review.score}</Badge>
          <Badge variant="outline">Pendente</Badge>
          {review.product.provider ? (
            <span className="text-muted-foreground text-xs">
              Fornecedor: {review.product.provider}
            </span>
          ) : null}
        </div>
        <time
          className="text-muted-foreground text-xs"
          dateTime={review.created_at}
        >
          Recebida em {formatReviewDate(review.created_at)}
        </time>
      </div>

      <div className="grid items-center gap-4 p-4 lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(14rem,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Produto
          </span>
          <Button
            type="button"
            variant="link"
            className="h-auto w-fit p-0 text-left font-semibold wrap-break-word whitespace-normal"
            onClick={() => onEditProduct(review.product.id)}
          >
            {review.product.name}
          </Button>
        </div>

        <ArrowRight
          className="text-muted-foreground hidden lg:block"
          aria-hidden="true"
        />
        <ArrowDown
          className="text-muted-foreground lg:hidden"
          aria-hidden="true"
        />

        <div className="bg-muted/50 flex min-w-0 flex-col gap-2 rounded-lg p-3">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Sugestão automática
          </span>
          <p className="font-medium wrap-break-word">{suggestedPath}</p>
          <p className="text-muted-foreground text-xs">
            Confirme a sugestão ou escolha outra categoria abaixo.
          </p>
        </div>
      </div>

      <div className="border-border bg-muted/20 flex flex-col gap-3 border-t p-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label
            htmlFor={`review-category-${review.id}`}
            className="text-sm font-medium"
          >
            Categoria final
          </label>
          <Select
            value={selectedCategoryId}
            disabled={categoriesPending || approveMutation.isPending}
            onValueChange={setSelectedCategoryId}
          >
            <SelectTrigger
              id={`review-category-${review.id}`}
              className="min-h-11 w-full sm:min-h-9 xl:max-w-md"
              aria-invalid={!selectedCategoryExists}
            >
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(20rem,var(--radix-select-content-available-height))]">
              <SelectGroup>
                {categoryOptions.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={String(option.id)}
                    disabled={!option.active}
                  >
                    {option.label}
                    {option.active ? "" : " · inativa"}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {review.suggested_category ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-9"
              disabled={approveMutation.isPending}
              onClick={() => onReject(review)}
            >
              <X data-icon="inline-start" />
              Rejeitar sugestão
            </Button>
          ) : null}
          <Button
            type="button"
            className="min-h-11 sm:min-h-9"
            disabled={
              !selectedCategoryId ||
              !selectedCategoryExists ||
              categoriesPending ||
              approveMutation.isPending
            }
            onClick={() => void handleApprove()}
          >
            {approveMutation.isPending ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : (
              <Check data-icon="inline-start" />
            )}
            {approveMutation.isPending ? "Aprovando..." : "Aprovar categoria"}
          </Button>
        </div>
      </div>
    </article>
  );
}

type ClassificationReviewManagerProps = {
  token: string;
};

function parseProductId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const productId = Number(value);
  return productId > 0 ? productId : null;
}

export function ClassificationReviewManager({
  token,
}: ClassificationReviewManagerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedProduct = searchParams.get("review_product")?.trim() ?? "";
  const rawPage = Number(searchParams.get("review_page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const selectedProductId = parseProductId(searchParams.get("product"));
  const [reviewToReject, setReviewToReject] = useState<CategoryReview | null>(
    null,
  );
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [productInput, setProductInput] = useState(appliedProduct);

  const query = useCategoryReviewsQuery({
    product: appliedProduct || undefined,
    page,
  });
  const categoriesQuery = useAdminCategoriesQuery();
  const rejectMutation = useRejectCategoryReviewMutation();
  const categoryOptions = useMemo(
    () => flattenCategoryOptions(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const reviews = query.data?.reviews ?? [];
  const pagination = query.data?.pagination;
  const total = pagination?.total ?? 0;

  const updateSearchParams = (
    updates: Record<string, string | null>,
    options?: { replace?: boolean },
  ) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: options?.replace ?? false });
  };

  const clearFilters = () => {
    setProductInput("");
    updateSearchParams(
      {
        review_product: null,
        review_page: null,
      },
      { replace: true },
    );
  };

  useEffect(() => {
    const trimmed = productInput.trim();
    if (trimmed === appliedProduct) return;

    const timeout = setTimeout(() => {
      updateSearchParams(
        { review_product: trimmed || null, review_page: null },
        { replace: true },
      );
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productInput]);

  const handleReject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewToReject) return;

    try {
      await rejectMutation.mutateAsync({
        reviewId: reviewToReject.id,
        reviewerNotes: reviewerNotes.trim() || undefined,
      });
      setReviewToReject(null);
      setReviewerNotes("");
      toast.success("Sugestão rejeitada com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível rejeitar a sugestão.",
      );
    }
  };

  const pageFrom =
    total === 0
      ? 0
      : ((pagination?.current_page ?? page) - 1) *
          (pagination?.per_page ?? 10) +
        1;
  const pageTo = Math.min(
    total,
    (pagination?.current_page ?? page) * (pagination?.per_page ?? 10),
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Revisão de classificação</h1>
            {query.data ? (
              <Badge variant={total > 0 ? "secondary" : "outline"}>
                {total} {total === 1 ? "pendência" : "pendências"}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Revise produtos com classificação automática inconclusiva. Aprove a
            categoria sugerida, substitua-a por outra ou rejeite a sugestão.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {query.data
            ? `Mostrando ${pageFrom}–${pageTo} de ${total} revisões`
            : null}
        </p>
        <div className="relative w-full sm:w-72">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={productInput}
            onChange={(event) => setProductInput(event.target.value)}
            placeholder="Buscar pelo nome do produto"
            aria-label="Buscar pelo nome do produto"
            className="h-9 pl-9"
          />
        </div>
      </div>

      {categoriesQuery.isError && categoryOptions.length === 0 ? (
        <div
          className="border-border bg-card flex items-start gap-3 rounded-lg border p-4"
          role="alert"
        >
          <TriangleAlert className="text-destructive" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Categorias indisponíveis</p>
            <p className="text-muted-foreground text-sm">
              Ainda é possível rejeitar sugestões, mas a aprovação ficará
              indisponível até as categorias serem recarregadas.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => void categoriesQuery.refetch()}
          >
            <RotateCw data-icon="inline-start" />
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="text-muted-foreground flex min-h-64 items-center justify-center gap-2 text-sm">
          <LoaderCircle aria-hidden="true" className="animate-spin" />
          Carregando revisões...
        </div>
      ) : query.isError ? (
        <div className="border-border bg-card flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center">
          <TriangleAlert className="text-destructive" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Não foi possível carregar a fila</p>
            <p className="text-muted-foreground text-sm">
              {query.error.message}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            <RotateCw data-icon="inline-start" />
            Tentar novamente
          </Button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="border-border bg-card flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center">
          <CircleCheckBig
            className="text-muted-foreground"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              {appliedProduct
                ? "Nenhuma revisão encontrada"
                : "Fila de revisão concluída"}
            </p>
            <p className="text-muted-foreground max-w-md text-sm">
              {appliedProduct
                ? "Revise os filtros aplicados ou limpe a busca para ver todas as pendências."
                : "Não há produtos aguardando uma decisão de classificação."}
            </p>
          </div>
          {appliedProduct ? (
            <Button type="button" variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              categoryOptions={categoryOptions}
              categoriesPending={categoriesQuery.isLoading}
              onEditProduct={(productId) =>
                updateSearchParams({ product: String(productId) })
              }
              onReject={(selectedReview) => {
                setReviewToReject(selectedReview);
                setReviewerNotes("");
              }}
            />
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 ? (
        <>
          <Separator />
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-muted-foreground text-sm">
              Página {pagination.current_page} de {pagination.last_page}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pagination.current_page <= 1}
                onClick={() =>
                  updateSearchParams({
                    review_page: String(pagination.current_page - 1),
                  })
                }
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() =>
                  updateSearchParams({
                    review_page: String(pagination.current_page + 1),
                  })
                }
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Dialog
        open={reviewToReject !== null}
        onOpenChange={(open) => {
          if (!open && !rejectMutation.isPending) {
            setReviewToReject(null);
            setReviewerNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar sugestão?</DialogTitle>
            <DialogDescription>
              A sugestão para “{reviewToReject?.product.name}” será marcada como
              rejeitada. Você pode registrar o motivo para manter o histórico da
              decisão.
            </DialogDescription>
          </DialogHeader>

          <form
            id="reject-category-review-form"
            className="flex flex-col gap-2"
            onSubmit={handleReject}
          >
            <label htmlFor="reviewer-notes" className="text-sm font-medium">
              Observação{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="reviewer-notes"
              value={reviewerNotes}
              onChange={(event) => setReviewerNotes(event.target.value)}
              placeholder="Explique por que a sugestão não corresponde ao produto."
              disabled={rejectMutation.isPending}
            />
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={rejectMutation.isPending}
              onClick={() => setReviewToReject(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="reject-category-review-form"
              variant="destructive"
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <X data-icon="inline-start" />
              )}
              {rejectMutation.isPending ? "Rejeitando..." : "Rejeitar sugestão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedProductId ? (
        <AdminProductEditor
          key={selectedProductId}
          productId={selectedProductId}
          token={token}
          onClose={() => updateSearchParams({ product: null })}
        />
      ) : null}
    </div>
  );
}
