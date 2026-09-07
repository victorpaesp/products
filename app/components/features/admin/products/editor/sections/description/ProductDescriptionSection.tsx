import {
  FileText,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import type { Product } from "~/types";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Textarea } from "~/components/ui/textarea";
import toast from "react-hot-toast";
import { useUpdateProductDescriptionMutation } from "~/hooks/useProductDescription";
import {
  getOriginalProductDescription,
  normalizeDescriptionOverride,
} from "~/lib/product-description";

type ProductDescriptionSectionProps = {
  product: Product;
  onDirtyChange: (dirty: boolean) => void;
};

export function ProductDescriptionSection({
  product,
  onDirtyChange,
}: ProductDescriptionSectionProps) {
  const initialOverride = normalizeDescriptionOverride(
    product.description_override,
  );
  const originalDescription = getOriginalProductDescription(product);
  const [savedOverride, setSavedOverride] = useState<string | null>(
    initialOverride,
  );
  const savedDisplayValue = savedOverride ?? originalDescription ?? "";
  const [draft, setDraft] = useState(savedDisplayValue);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const mutation = useUpdateProductDescriptionMutation();
  const normalizedDraft = normalizeDescriptionOverride(draft);
  const dirty =
    normalizedDraft !== normalizeDescriptionOverride(savedDisplayValue);
  const isManual = savedOverride !== null;

  const handleStartEditing = () => {
    setDraft(savedDisplayValue);
    setErrorMessage("");
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setDraft(savedDisplayValue);
    setErrorMessage("");
    setIsEditing(false);
    onDirtyChange(false);
  };

  const handleDraftChange = (nextDraft: string) => {
    setDraft(nextDraft);
    setErrorMessage("");
    onDirtyChange(
      normalizeDescriptionOverride(nextDraft) !==
        normalizeDescriptionOverride(savedDisplayValue),
    );
  };

  const persistOverride = async (nextOverride: string | null) => {
    setErrorMessage("");

    try {
      const response = await mutation.mutateAsync({
        productId: product.id,
        descriptionOverride: nextOverride,
      });
      const persistedOverride = normalizeDescriptionOverride(
        response.description_override !== undefined
          ? response.description_override
          : nextOverride,
      );
      const persistedDisplayValue =
        persistedOverride ?? originalDescription ?? "";

      setSavedOverride(persistedOverride);
      setDraft(persistedDisplayValue);
      setIsEditing(false);
      onDirtyChange(false);
      toast.success(
        persistedOverride
          ? "Descrição atualizada."
          : "Descrição original restaurada.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a descrição. Tente novamente.",
      );
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dirty || mutation.isPending) return;
    void persistOverride(normalizedDraft);
  };

  const handleRestore = () => {
    setRestoreDialogOpen(false);
    void persistOverride(null);
  };

  return (
    <>
      <section
        aria-labelledby="description-title"
        className="rounded-lg border p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 id="description-title" className="font-semibold">
                Descrição
              </h4>
              <Badge variant={isManual ? "secondary" : "outline"}>
                {isManual ? "Editada manualmente" : "Original do fornecedor"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              Texto exibido nos detalhes do produto.
            </p>
          </div>

          {!isEditing ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleStartEditing}
            >
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
          ) : null}
        </div>

        {!isEditing ? (
          <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">
            {savedDisplayValue || "Nenhuma descrição foi enviada."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <FieldGroup>
              <Field
                data-invalid={Boolean(errorMessage)}
                data-disabled={mutation.isPending || undefined}
              >
                <FieldLabel htmlFor="description-override">
                  Descrição exibida no catálogo
                </FieldLabel>
                <Textarea
                  id="description-override"
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  disabled={mutation.isPending}
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby="description-override-help"
                  placeholder="O fornecedor ainda não enviou uma descrição."
                  className="min-h-40 resize-y"
                />
                <FieldDescription id="description-override-help">
                  Ao salvar, este texto entra no ar imediatamente.
                </FieldDescription>
                {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
              </Field>
            </FieldGroup>

            <Accordion type="single" collapsible>
              <AccordionItem
                value="original-description"
                className="rounded-md border px-3"
              >
                <AccordionTrigger className="min-h-11 text-sm">
                  <span className="flex items-center gap-2">
                    <FileText />
                    Comparar com o original
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div
                    className="bg-muted/60 min-h-20 rounded-md p-3 text-sm leading-relaxed whitespace-pre-wrap"
                    role="note"
                  >
                    {originalDescription ||
                      "O fornecedor não enviou uma descrição."}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRestoreDialogOpen(true)}
                disabled={!isManual || mutation.isPending}
              >
                <RotateCcw data-icon="inline-start" />
                Restaurar original
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEditing}
                  disabled={mutation.isPending}
                >
                  <X data-icon="inline-start" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!dirty || mutation.isPending}
                >
                  {mutation.isPending ? (
                    <LoaderCircle
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  {mutation.isPending ? "Salvando..." : "Salvar alteração"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </section>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar descrição original?</AlertDialogTitle>
            <AlertDialogDescription>
              A substituição manual será removida e o conteúdo enviado pelo
              fornecedor voltará a aparecer imediatamente no catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={mutation.isPending}
            >
              Restaurar original
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
