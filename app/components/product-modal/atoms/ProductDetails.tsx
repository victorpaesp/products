import { useEffect, useRef, useState } from "react";
import { useFetcher, useRouteLoaderData } from "@remix-run/react";
import type { Product } from "~/types/index";
import { formatPrice } from "~/lib/utils";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import toast from "~/components/ui/toast-client";
import { Pencil, RotateCcw, Save, X, Loader2 } from "lucide-react";
import type { loader as rootLoader } from "~/root";
import type {
  DescriptionActionData,
  ProductDetailsProps,
} from "~/types/components";

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
  const fetcher = useFetcher<DescriptionActionData>();
  const isAdmin = rootData?.user?.role === "admin";
  const handledResponseRef = useRef<DescriptionActionData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");

  const isSaving = fetcher.state !== "idle";

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

  const submitDescription = (value: string | null) => {
    if (isSaving) return;

    fetcher.submit(
      {
        description_override: value || "",
      },
      {
        method: "post",
        action: `/api/products/${product.id}/description`,
      },
    );
  };

  const handleSave = async () => {
    submitDescription(editedDescription.trim() || null);
  };

  const handleRestoreOriginal = async () => {
    submitDescription(null);
  };

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (handledResponseRef.current === fetcher.data) return;

    handledResponseRef.current = fetcher.data;

    if (fetcher.data.error) {
      toast.error(fetcher.data.error);
      return;
    }

    if (fetcher.data.ok) {
      const updatedProduct: Product = {
        ...product,
        description_override: fetcher.data.description_override || null,
      };
      onProductUpdate?.(updatedProduct);
      setIsEditing(false);
      toast.success(
        fetcher.data.description_override
          ? "Descrição atualizada com sucesso!"
          : "Descrição original restaurada!",
      );
    }
  }, [fetcher.data, fetcher.state, onProductUpdate, product]);

  return (
    <div className="space-y-4">
      <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
        {product.product_cod} - {product.name}
      </h2>

      <div className="text-gray-600">
        <div className="mb-4">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Digite a descrição do produto..."
                className="min-h-[100px]"
                disabled={isSaving}
              />
              <div className="flex items-center gap-2 flex-wrap">
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                {hasOverride && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRestoreOriginal}
                    disabled={isSaving}
                    className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restaurar Original
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="group relative">
              <p className="pr-8">{displayDescription}</p>
              {isAdmin && hasOverride && (
                <span className="inline-block mt-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  Descrição editada
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={handleStartEdit}
                  className="absolute top-0 right-0 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Editar descrição"
                  title="Editar descrição"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Preço</p>
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </p>
          </div>

          {product.product_weight && (
            <div>
              <p className="text-sm text-gray-500">Peso</p>
              <p className="text-xl font-bold text-gray-900">
                {product.product_weight}
              </p>
            </div>
          )}

          {product.quantity_box && (
            <div>
              <p className="text-sm text-gray-500">Quantidade por Caixa</p>
              <p className="text-xl font-bold text-gray-900">
                {product.quantity_box}
              </p>
            </div>
          )}
        </div>

        {product.variations && product.variations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Variações</p>
            <div className="flex flex-wrap gap-2">
              {product.variations.map((variation, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {variation.name} - Estoque: {variation.stock} -{" "}
                  {formatPrice(variation.price)}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.product_mention && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Menção</p>
            <p className="text-gray-900">{product.product_mention}</p>
          </div>
        )}

        {product.box_mention && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Menção da Caixa</p>
            <p className="text-gray-900">{product.box_mention}</p>
          </div>
        )}
      </div>
    </div>
  );
}
