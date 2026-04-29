import { useState } from "react";
import { formatPrice, getProductImage, normalizeImageUrl } from "~/lib/utils";
import { ProductModal } from "~/components/features/products/modal/ProductModal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "~/components/ui/dialog";

import type { Product, Variation } from "~/types/index";
import type { ProductCardProps } from "~/types/components";
export function ProductCard({
  product,
  onSelect,
  selectedVariations,
  onProductUpdate,
}: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [pendingVariations, setPendingVariations] = useState<string[]>([]);

  const imageSrc = getProductImage(product);

  const hasMultipleVariations =
    product.variations && product.variations.length > 1;

  const hasAnySelected = selectedVariations && selectedVariations.length > 0;

  const allVariationsSelected = hasMultipleVariations
    ? selectedVariations &&
      selectedVariations.length === product.variations.length
    : selectedVariations && selectedVariations.length === 1;

  const productAsVariation: Variation = {
    id: product.id,
    product_id: product.id,
    product_cod: product.product_cod,
    name: product.name,
    price: product.price,
    stock: 0,
    images: [...(product.gallery || [])].filter(Boolean),
  };

  const handleCheckboxChange = () => {
    if (hasMultipleVariations) {
      setPendingVariations(selectedVariations ?? []);
      setShowVariationModal(true);
    } else if (
      onSelect &&
      product.variations &&
      product.variations.length === 1
    ) {
      onSelect(product, product.variations[0]);
    } else if (
      onSelect &&
      product.variations &&
      product.variations.length === 0
    ) {
      onSelect(product, productAsVariation);
    }
  };

  return (
    <>
      <div
        className="hover:border-primary relative flex cursor-pointer flex-col gap-1 overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-1 shadow transition-colors duration-200 sm:p-3"
        onClick={() => setIsModalOpen(true)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsModalOpen(true);
          }
        }}
        role="group"
      >
        <div className="relative">
          <div className="aspect-square">
            <img
              src={imageSrc}
              alt={product.name}
              className="h-full w-full rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/logo-santomimo.png";
              }}
            />
          </div>
          {product.variations.length > 1 && (
            <Badge className="absolute bottom-2 left-2 w-fit">
              {product.variations.length} variações
            </Badge>
          )}
        </div>
        <div className="flex flex-col px-2 py-1">
          <div className="flex h-full flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex flex-col">
              <h2
                className="line-clamp-1 text-sm font-medium break-all text-gray-900 sm:text-base"
                title={product.name}
                aria-label={product.name}
              >
                {product.name}
              </h2>
              <span
                className="line-clamp-1 text-[10px] font-medium break-all text-gray-500 sm:text-xs"
                title={product.product_cod}
                aria-label={product.product_cod}
              >
                {product.product_cod}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p className="font-semibold text-gray-900 sm:text-lg">
              {formatPrice(product.price)}
            </p>
            <Button
              variant={hasAnySelected ? "default" : "outline"}
              size={"sm"}
              className="w-full rounded-full sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckboxChange();
              }}
            >
              {hasAnySelected ? "Selecionado" : "Selecionar"}
            </Button>
          </div>
        </div>
      </div>
      <ProductModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductUpdate={onProductUpdate}
      />

      <Dialog
        open={showVariationModal}
        onOpenChange={(open) => {
          setShowVariationModal(open);
          if (!open) setPendingVariations([]);
        }}
      >
        <DialogContent className="flex max-h-[555px] w-[90vw] max-w-[90vw] flex-col p-6 sm:w-full sm:max-w-md">
          <div className="flex items-center justify-between">
            <DialogTitle asChild>
              <h3 className="text-lg font-bold">Selecione uma variação</h3>
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-500">
            Escolha uma das variações disponíveis do produto para continuar.
          </DialogDescription>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-3 p-1">
              {product.variations?.map((v, idx) => (
                <button
                  key={v.product_cod || idx}
                  type="button"
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors hover:bg-gray-50 ${
                    pendingVariations.includes(v.product_cod)
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                  onClick={() => {
                    setPendingVariations((prev) =>
                      prev.includes(v.product_cod)
                        ? prev.filter((cod) => cod !== v.product_cod)
                        : [...prev, v.product_cod],
                    );
                  }}
                >
                  <img
                    src={normalizeImageUrl(
                      Array.isArray(v.images?.[0])
                        ? v.images[0][0] || "/logo-santomimo.png"
                        : v.images?.[0] || "/logo-santomimo.png",
                    )}
                    alt={v.name || product.name}
                    className="size-20 shrink-0 rounded-md object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/logo-santomimo.png";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 line-clamp-1 font-medium text-gray-900">
                      {v.name || product.name}
                    </div>
                    <div className="mb-1 text-xs text-gray-500">
                      Cod: {v.product_cod}
                    </div>
                    <div className="mb-1 text-xs text-gray-500">
                      Estoque: {v.stock ?? 0}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPendingVariations([]);
                  setShowVariationModal(false);
                }}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              className="flex-1"
              onClick={() => {
                if (onSelect) {
                  const prev = selectedVariations ?? [];
                  const toAdd = pendingVariations.filter(
                    (cod) => !prev.includes(cod),
                  );
                  const toRemove = prev.filter(
                    (cod) => !pendingVariations.includes(cod),
                  );
                  [...toAdd, ...toRemove].forEach((cod) => {
                    const variation = product.variations.find(
                      (v) => v.product_cod === cod,
                    );
                    if (variation) onSelect(product, variation);
                  });
                }
                setPendingVariations([]);
                setShowVariationModal(false);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
