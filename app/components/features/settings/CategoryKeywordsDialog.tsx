import { useState } from "react";
import { LoaderCircle, Plus, RotateCw, Save, Tags, Trash2 } from "lucide-react";
import type { AdminCategory, CategoryKeyword } from "~/types";
import {
  useAddCategoryKeywordMutation,
  useCategoryKeywordsQuery,
  useDeleteCategoryKeywordMutation,
  useUpdateCategoryKeywordMutation,
} from "~/hooks/useCategories";
import { normalizeCategoryKeywordText } from "~/lib/categories";
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
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import toast from "react-hot-toast";

const KEYWORD_WEIGHTS = [1, 2, 3, 4, 5] as const;

type CategoryKeywordRowProps = {
  keyword: CategoryKeyword;
  onDelete: (keyword: CategoryKeyword) => void;
};

function CategoryKeywordRow({ keyword, onDelete }: CategoryKeywordRowProps) {
  const [weight, setWeight] = useState(keyword.weight);
  const mutation = useUpdateCategoryKeywordMutation();
  const changed = weight !== keyword.weight;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!changed) return;

    try {
      await mutation.mutateAsync({
        keywordId: keyword.id,
        weight,
      });
      toast.success("Peso atualizado com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o peso.",
      );
    }
  };

  return (
    <form
      className="border-border grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto] sm:items-end"
      onSubmit={handleSubmit}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-sm font-medium">Palavra-chave</span>
        <p className="bg-muted truncate rounded-md px-3 py-2 text-sm">
          {keyword.keyword}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={`keyword-weight-${keyword.id}`}
          className="text-sm font-medium"
        >
          Peso
        </label>
        <Select
          value={String(weight)}
          disabled={mutation.isPending}
          onValueChange={(value) => setWeight(Number(value))}
        >
          <SelectTrigger id={`keyword-weight-${keyword.id}`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {KEYWORD_WEIGHTS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={!changed || mutation.isPending}
      >
        {mutation.isPending ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : (
          <Save data-icon="inline-start" />
        )}
        Salvar peso
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={mutation.isPending}
        aria-label={`Remover a palavra-chave ${keyword.keyword}`}
        title="Remover palavra-chave"
        onClick={() => onDelete(keyword)}
      >
        <Trash2 className="text-destructive" />
      </Button>
    </form>
  );
}

type CategoryKeywordsDialogProps = {
  category: AdminCategory;
  onOpenChange: (open: boolean) => void;
};

export function CategoryKeywordsDialog({
  category,
  onOpenChange,
}: CategoryKeywordsDialogProps) {
  const [newKeyword, setNewKeyword] = useState("");
  const [newWeight, setNewWeight] = useState(1);
  const [formError, setFormError] = useState("");
  const [keywordToDelete, setKeywordToDelete] =
    useState<CategoryKeyword | null>(null);
  const query = useCategoryKeywordsQuery(category.id);
  const addMutation = useAddCategoryKeywordMutation();
  const deleteMutation = useDeleteCategoryKeywordMutation();
  const keywords = query.data ?? [];

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = normalizeCategoryKeywordText(newKeyword);

    if (!keyword) {
      setFormError("Informe a palavra-chave.");
      return;
    }

    if (
      keywords.some(
        (item) => normalizeCategoryKeywordText(item.keyword) === keyword,
      )
    ) {
      setFormError("Esta palavra-chave já está cadastrada na categoria.");
      return;
    }

    try {
      await addMutation.mutateAsync({
        categoryId: category.id,
        body: { keyword, weight: newWeight },
      });
      setNewKeyword("");
      setNewWeight(1);
      setFormError("");
      toast.success("Palavra-chave adicionada com sucesso.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar a palavra-chave.",
      );
    }
  };

  const handleDelete = async () => {
    if (!keywordToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        keywordId: keywordToDelete.id,
      });
      setKeywordToDelete(null);
      toast.success("Palavra-chave removida com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a palavra-chave.",
      );
    }
  };

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_auto_minmax(0,1fr)] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar palavras-chave</DialogTitle>
            <DialogDescription>
              {`Gerencie os termos e pesos usados para classificar produtos em “${category.name}”. Para trocar um termo, remova-o e adicione outro.`}
            </DialogDescription>
          </DialogHeader>

          <form
            className="border-border flex flex-col gap-3 rounded-lg border p-4"
            onSubmit={handleAdd}
          >
            <div className="flex flex-col gap-1">
              <h3 className="font-medium">Nova palavra-chave</h3>
              <p className="text-muted-foreground text-xs">
                O termo será enviado sem acentos e em letras minúsculas.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:items-end">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="new-category-keyword"
                  className="text-sm font-medium"
                >
                  Palavra-chave
                </label>
                <Input
                  id="new-category-keyword"
                  value={newKeyword}
                  onChange={(event) => {
                    setNewKeyword(event.target.value);
                    setFormError("");
                  }}
                  maxLength={100}
                  placeholder="Ex.: Brinquedos"
                  aria-invalid={Boolean(formError)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="new-category-keyword-weight"
                  className="text-sm font-medium"
                >
                  Peso
                </label>
                <Select
                  value={String(newWeight)}
                  disabled={addMutation.isPending}
                  onValueChange={(value) => {
                    setNewWeight(Number(value));
                    setFormError("");
                  }}
                >
                  <SelectTrigger
                    id="new-category-keyword-weight"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {KEYWORD_WEIGHTS.map((weight) => (
                        <SelectItem key={weight} value={String(weight)}>
                          {weight}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <LoaderCircle
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : (
                  <Plus data-icon="inline-start" />
                )}
                Adicionar
              </Button>
            </div>

            {formError ? (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            ) : null}
          </form>

          <Separator />

          <div
            className="flex min-h-0 flex-col gap-3"
            role="region"
            aria-labelledby="registered-keywords-title"
          >
            <div className="flex items-center gap-2">
              <Tags aria-hidden="true" />
              <h3 id="registered-keywords-title" className="font-medium">
                Palavras-chave cadastradas
              </h3>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain pr-1">
              {query.isLoading ? (
                <div className="text-muted-foreground flex min-h-32 items-center justify-center gap-2 text-sm">
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                  Carregando palavras-chave...
                </div>
              ) : query.isError ? (
                <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
                  <p className="text-muted-foreground text-sm">
                    {query.error.message ||
                      "Não foi possível carregar as palavras-chave."}
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
              ) : keywords.length === 0 ? (
                <div className="border-border flex min-h-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-4 text-center">
                  <p className="font-medium">
                    Nenhuma palavra-chave cadastrada
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Use o formulário acima para adicionar o primeiro termo.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {keywords.map((keyword) => (
                    <CategoryKeywordRow
                      key={keyword.id}
                      keyword={keyword}
                      onDelete={setKeywordToDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={keywordToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setKeywordToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover palavra-chave?</AlertDialogTitle>
            <AlertDialogDescription>
              “{keywordToDelete?.keyword}” deixará de contribuir para a
              classificação de produtos nesta categoria.
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
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
