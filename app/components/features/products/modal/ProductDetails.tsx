import { useState } from "react";
import { useRouteLoaderData } from "@remix-run/react";
import type { Product } from "~/types/index";
import {
  formatPrice,
  formatWeight,
  formatBoxWeight,
  parseDimensions,
  formatNumberWithoutUnnecessaryDecimals,
  hasNonZeroNumber,
  getProviderLogoPath,
  getVariationDifference,
} from "~/lib/utils";
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
  const formattedProductWeight = formatWeight(product.product_weight);
  const formattedBoxWeight = formatBoxWeight(product.box_weight);
  const logoPath = getProviderLogoPath(product.provider);

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
      {isAdmin && (
        <span>
          <img
            src={logoPath}
            alt={`${product.provider} logo`}
            className="h-25 w-auto"
          />
        </span>
      )}

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
              <div className="flex flex-col gap-10">
                {(product.fiscal_classification_type ||
                  product.fiscal_classification_code) && (
                  <div className="grid grid-cols-2 gap-4">
                    {product.fiscal_classification_type && (
                      <div>
                        <p className="text-xs text-neutral-500">
                          Tipo de Classificação Fiscal
                        </p>
                        <p className="text-base font-semibold text-neutral-900">
                          {product.fiscal_classification_type}
                        </p>
                      </div>
                    )}

                    {product.fiscal_classification_code && (
                      <div>
                        <p className="text-xs text-neutral-500">
                          Código de Classificação Fiscal
                        </p>
                        <p className="text-base font-semibold text-neutral-900">
                          {product.fiscal_classification_code}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {(product.product_weight || product.product_mention) && (
                  <div className="flex flex-col gap-3">
                    <div className="border-b border-neutral-200 pb-2">
                      <p className="text-base font-semibold text-neutral-900">
                        Produto
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {formattedProductWeight && (
                        <div>
                          <p className="text-xs text-neutral-500">Peso</p>
                          <p className="text-base font-semibold text-neutral-900">
                            {formattedProductWeight}
                          </p>
                        </div>
                      )}

                      {product.product_mention &&
                        hasNonZeroNumber(product.product_mention) && (
                          <>
                            {parseDimensions(product.product_mention).map(
                              (dim) => (
                                <div key={`product-${dim.label}`}>
                                  <p className="text-xs text-neutral-500">
                                    {dim.label}
                                  </p>
                                  <p className="text-base font-semibold text-neutral-900">
                                    {dim.value}
                                  </p>
                                </div>
                              ),
                            )}
                          </>
                        )}
                    </div>
                  </div>
                )}

                {(product.quantity_box || product.box_mention) && (
                  <div className="flex flex-col gap-3">
                    <div className="border-b border-neutral-200 pb-2">
                      <p className="text-base font-semibold text-neutral-900">
                        Caixa
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {product.quantity_box && (
                        <div>
                          <p className="text-xs text-neutral-500">
                            Quantidade por Caixa
                          </p>
                          <p className="text-base font-semibold text-neutral-900">
                            {formatNumberWithoutUnnecessaryDecimals(
                              product.quantity_box,
                            )}
                          </p>
                        </div>
                      )}

                      {formattedBoxWeight && (
                        <div>
                          <p className="text-xs text-neutral-500">
                            Peso da Caixa
                          </p>
                          <p className="text-base font-semibold text-neutral-900">
                            {formattedBoxWeight}
                          </p>
                        </div>
                      )}

                      {product.box_mention &&
                        hasNonZeroNumber(product.box_mention) && (
                          <>
                            {parseDimensions(product.box_mention).map((dim) => (
                              <div key={`box-${dim.label}`}>
                                <p className="text-xs text-neutral-500">
                                  {dim.label}
                                </p>
                                <p className="text-base font-semibold text-neutral-900">
                                  {dim.value}
                                </p>
                              </div>
                            ))}
                          </>
                        )}
                    </div>
                  </div>
                )}

                {product.variations && product.variations.length > 1 && (
                  <div className="flex flex-col gap-3">
                    <div className="border-b border-neutral-200 pb-2">
                      <p className="text-base font-semibold text-neutral-900">
                        Variações
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {product.variations.map((variation, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-neutral-500">Variação</p>
                            <p className="text-base font-semibold text-neutral-900">
                              {getVariationDifference(
                                product.name,
                                variation.name,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-neutral-500">Estoque</p>
                            <p className="text-base font-semibold text-neutral-900">
                              {variation.stock}
                            </p>
                          </div>

                          {product.quantity_box && (
                            <div>
                              <p className="text-xs text-neutral-500">Preço</p>
                              <p className="text-base font-semibold text-neutral-900">
                                {formatPrice(variation.price)}
                              </p>
                            </div>
                          )}
                        </div>
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
