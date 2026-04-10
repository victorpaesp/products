import { useState } from "react";
import { formatPrice, getProductImage, normalizeImageUrl } from "~/lib/utils";
import { ProductModal } from "~/components/features/products/modal/ProductModal";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
        className={`flex flex-col rounded-lg overflow-hidden relative gap-1 ${
          hasAnySelected ? "border-[#556B2F]" : "border-surface-200"
        }`}
        role="group"
      >
        <div className="relative">
          <div
            className="aspect-square cursor-pointer"
            onClick={() => setIsModalOpen(true)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsModalOpen(true);
              }
            }}
          >
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl border border-gray-300 hover:shadow-md transition-shadow bg-white"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/logo-santomimo.png";
              }}
            />
          </div>
          <div
            className="absolute top-2 right-2 z-[1]"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={
                hasMultipleVariations
                  ? !!allVariationsSelected
                  : !!hasAnySelected
              }
              onCheckedChange={handleCheckboxChange}
              className="size-8 md:size-6 rounded border border-gray-400 bg-white shadow-md data-[state=checked]:bg-[#556B2F] data-[state=checked]:border-[#556B2F] data-[state=checked]:text-white"
            />
          </div>
          {product.variations.length > 1 && (
            <Badge
              variant="contrast"
              className="w-fit absolute bottom-2 left-2"
            >
              {product.variations.length} variações
            </Badge>
          )}
        </div>
        <div className="p-1 h-full flex flex-col sm:flex-row gap-2 sm:gap-6 justify-between items-start sm:items-center">
          <div className="flex flex-col">
            <h2 className="text-gray-900 font-medium line-clamp-1 text-sm sm:text-base">
              {product.name}
            </h2>
            <span className="text-[10px] sm:text-sm text-gray-500 font-medium line-clamp-1">
              {product.product_cod}
            </span>
          </div>
          <p className="font-semibold sm:text-lg text-gray-900">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
      <ProductModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductUpdate={onProductUpdate}
      />

      <Dialog open={showVariationModal} onOpenChange={setShowVariationModal}>
        <DialogContent className="max-w-[90vw] w-[90vw] sm:max-w-md sm:w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between">
            <DialogTitle asChild>
              <h3 className="text-lg font-bold">Selecione uma variação</h3>
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-500 text-sm">
            Escolha uma das variações disponíveis do produto para continuar.
          </DialogDescription>
          <div className="space-y-3">
            {product.variations?.map((v, idx) => (
              <button
                key={v.product_cod || idx}
                type="button"
                className={`flex items-center gap-3 p-3 border-2 rounded-lg w-full text-left hover:bg-gray-50 transition-colors ${
                  selectedVariations?.includes(v.product_cod)
                    ? "border-[#556B2F] bg-[#556B2F]/5"
                    : "border-gray-200"
                }`}
                onClick={() => {
                  if (onSelect) onSelect(product, v);
                }}
              >
                <img
                  src={normalizeImageUrl(
                    Array.isArray(v.images?.[0])
                      ? v.images[0][0] || "/logo-santomimo.png"
                      : v.images?.[0] || "/logo-santomimo.png",
                  )}
                  alt={v.name || product.name}
                  className="size-20 object-cover rounded-md flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/logo-santomimo.png";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 mb-1 line-clamp-1">
                    {v.name || product.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    Cod: {v.product_cod}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    Estoque: {v.stock ?? 0}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
