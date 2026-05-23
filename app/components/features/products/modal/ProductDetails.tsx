import { useState } from "react";
import { useRouteLoaderData } from "@remix-run/react";
import type { Product } from "~/types/index";
import { formatPrice } from "~/lib/utils";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import toast from "~/components/ui/toast-client";
import { Pencil, RotateCcw, Save, X, Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "~/components/ui/accordion";
import type { loader as rootLoader } from "~/root";
import type { ProductDetailsProps } from "~/types/components";
import { useUpdateProductDescriptionMutation } from "~/hooks/useProductDescription";

function getDisplayDescription(product: Product): string {
  if (product.description_override) {
    return product.description_override;
  }
  return product.description_original || product.description;
}

function hasDescriptionOverride(product: Product): boolean {
  return (
    !!product.description_override && product.description_override.trim() !== ""
  );
}

function hasNonZeroNumber(value: string): boolean {
  return /[1-9]/.test(value);
}

export function ProductDetails({
  product,
  onProductUpdate,
}: ProductDetailsProps) {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const updateDescriptionMutation = useUpdateProductDescriptionMutation();
  const isAdmin = rootData?.user?.role === "admin";
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");

  const isSaving = updateDescriptionMutation.isPending;

  const displayDescription = getDisplayDescription(product);
  const hasOverride = hasDescriptionOverride(product);

  const handleStartEdit = () => {
    setEditedDescription(displayDescription);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDescription("");
  };

  const submitDescription = async (value: string | null) => {
    if (isSaving) return;

    try {
      const response = await updateDescriptionMutation.mutateAsync({
        productId: product.id,
        descriptionOverride: value,
      });

      const updatedProduct: Product = {
        ...product,
        description_override: response.description_override ?? value,
      };

      onProductUpdate?.(updatedProduct);
      setIsEditing(false);
      toast.success(
        (response.description_override ?? value)
          ? "Descrição atualizada com sucesso!"
          : "Descrição original restaurada!",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar descrição.";
      toast.error(message);
    }
  };

  const handleSave = async () => {
    await submitDescription(editedDescription.trim() || null);
  };

  const handleRestoreOriginal = async () => {
    await submitDescription(null);
  };

  return (
    <div className="flex h-full w-full flex-col gap-8 sm:w-1/2">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-500">
          {product.product_cod}
        </span>
        <h2 id="modal-title" className="text-4xl font-bold text-neutral-900">
          {product.name}
        </h2>
      </div>
      <span className="text-2xl font-bold text-neutral-900">
        {formatPrice(product.price)}
      </span>

      <div className="flex flex-col gap-2">
        <Accordion
          type="single"
          collapsible
          defaultValue="description"
          className="rounded-lg border bg-white"
        >
          <AccordionItem
            value="description"
            className="border-b px-4 last:border-b-0"
          >
            <AccordionTrigger>Descrição</AccordionTrigger>
            <AccordionContent>
              <div className="text-neutral-600">
                {isEditing ? (
                  <div className="space-y-3 p-1">
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Digite a descrição do produto..."
                      className="min-h-25"
                      disabled={isSaving}
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="gap-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-1"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salvar
                      </Button>
                      {hasOverride && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleRestoreOriginal}
                          disabled={isSaving}
                          className="gap-1 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restaurar Original
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="pr-8 text-sm">{displayDescription}</p>
                    {isAdmin && hasOverride && (
                      <span className="mt-1 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                        Descrição editada
                      </span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={handleStartEdit}
                        className="absolute top-0 right-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                        aria-label="Editar descrição"
                        title="Editar descrição"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion
          type="single"
          collapsible
          className="rounded-lg border bg-white"
        >
          <AccordionItem
            value="specs"
            className="border-b px-4 last:border-b-0"
          >
            <AccordionTrigger>Especificações</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {product.product_weight && (
                    <div>
                      <p className="text-sm text-neutral-500">Peso</p>
                      <p className="text-base font-bold text-neutral-900">
                        {product.product_weight}
                      </p>
                    </div>
                  )}

                  {product.quantity_box && (
                    <div>
                      <p className="text-sm text-neutral-500">
                        Quantidade por Caixa
                      </p>
                      <p className="text-base font-bold text-neutral-900">
                        {product.quantity_box}
                      </p>
                    </div>
                  )}

                  {product.product_mention &&
                    hasNonZeroNumber(product.product_mention) && (
                      <div>
                        <p className="text-sm text-neutral-500">
                          Dimensões do produto
                        </p>
                        <p className="text-base font-bold text-neutral-900">
                          {product.product_mention}
                        </p>
                      </div>
                    )}

                  {product.box_mention &&
                    hasNonZeroNumber(product.box_mention) && (
                      <div>
                        <p className="text-sm text-neutral-500">
                          Dimensões da caixa
                        </p>
                        <p className="text-base font-bold text-neutral-900">
                          {product.box_mention}
                        </p>
                      </div>
                    )}
                </div>

                {product.variations && product.variations.length > 1 && (
                  <div>
                    <p className="mb-2 text-sm text-neutral-500">Variações</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variations.map((variation, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-neutral-100 px-3 py-1 text-sm"
                        >
                          {variation.name} - Estoque: {variation.stock} -{" "}
                          {formatPrice(variation.price)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
