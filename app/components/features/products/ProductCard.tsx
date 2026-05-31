import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouteLoaderData } from "@remix-run/react";
import { LoaderCircle } from "lucide-react";
import {
  formatPrice,
  getProductCardImage,
  getProviderDisplayName,
  normalizeImageUrl,
} from "~/lib/utils";
import type { loader as rootLoader } from "~/root";
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
  preferVariationImage = false,
}: ProductCardProps) {
  const navigate = useNavigate();
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const isAdmin = rootData?.user?.role === "admin";
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  const imageSrc = getProductCardImage(product, { preferVariationImage });

  useEffect(() => {
    setIsImageLoading(true);

    const img = imageRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setIsImageLoading(false);
    }
  }, [imageSrc]);

  const hasMultipleVariations =
    product.variations && product.variations.length > 1;

  const visibleVariationCodes = new Set(
    product.variations.map((v) => v.product_cod),
  );
  const visibleSelectedVariations =
    selectedVariations?.filter((cod) => visibleVariationCodes.has(cod)) ?? [];

  const displayedVariationCod =
    preferVariationImage && product.variations?.length === 1
      ? product.variations[0].product_cod
      : null;

  const hasAnySelected = displayedVariationCod
    ? visibleSelectedVariations.includes(displayedVariationCod)
    : visibleSelectedVariations.length > 0;

  const selectedVariationCount = visibleSelectedVariations.length;
  const showSelectedCountBadge =
    hasMultipleVariations && selectedVariationCount > 0;

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

  const getProductDetailPath = () => {
    const params = new URLSearchParams();

    if (preferVariationImage && product.variations?.[0]?.id) {
      params.set("variation_id", String(product.variations[0].id));
    }

    const query = params.toString();
    return `/products/${product.id}${query ? `?${query}` : ""}`;
  };

  const handleOpenProduct = () => {
    navigate(getProductDetailPath(), {
      state: { from: window.location.href, listingProduct: product },
    });
  };

  return (
    <>
      <div
        className="hover:border-primary relative flex w-full transform cursor-pointer flex-col gap-1 overflow-hidden rounded-lg bg-white p-1 transition duration-300 ease-out hover:scale-[0.98] sm:p-3"
        style={{
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
        }}
        onClick={handleOpenProduct}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleOpenProduct();
          }
        }}
        role="group"
      >
        <div className="relative w-full">
          <div className="relative aspect-square w-full overflow-hidden rounded-[4px]">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoaderCircle
                  strokeWidth={1.5}
                  className="size-5 animate-spin text-neutral-400"
                />
              </div>
            )}
            <img
              ref={imageRef}
              src={imageSrc}
              alt={product.name}
              className={`h-full w-full object-cover transition-opacity duration-200 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setIsImageLoading(false)}
              onError={(e) => {
                setIsImageLoading(false);
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
        <div className="flex flex-col gap-1.5 px-1 py-2">
          <div className="flex h-full flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex flex-col">
              <h2
                className="line-clamp-1 text-sm font-medium break-all text-neutral-900 sm:text-base"
                title={product.name}
                aria-label={product.name}
              >
                {product.name}
              </h2>
              <span
                className="line-clamp-1 text-[10px] font-medium break-all text-neutral-500 sm:text-xs"
                title={product.product_cod}
                aria-label={product.product_cod}
              >
                {product.product_cod}
                {isAdmin && <> - {getProviderDisplayName(product.provider)}</>}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p className="font-semibold text-neutral-900 sm:text-lg">
              {formatPrice(product.price)}
            </p>
            <div className="relative w-full sm:w-auto">
              <Button
                variant={hasAnySelected ? "secondary" : "default"}
                size={"sm"}
                className="w-full sm:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckboxChange();
                }}
              >
                {hasAnySelected ? "Selecionado" : "Selecionar"}
              </Button>
              {showSelectedCountBadge && (
                <span
                  className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex size-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none"
                  aria-label={`${selectedVariationCount} variações selecionadas`}
                >
                  {selectedVariationCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showVariationModal} onOpenChange={setShowVariationModal}>
        <DialogContent className="flex max-h-138.75 w-[90vw] max-w-[90vw] flex-col p-6 sm:w-full sm:max-w-md">
          <div className="flex items-center justify-between">
            <DialogTitle asChild>
              <h3 className="text-lg font-bold">Selecione uma variação</h3>
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-neutral-500">
            Escolha uma das variações disponíveis do produto para continuar.
          </DialogDescription>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-3 p-1">
              {product.variations?.map((v, idx) => {
                const isSelected = visibleSelectedVariations.includes(
                  v.product_cod,
                );
                return (
                  <button
                    key={v.product_cod || idx}
                    type="button"
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors hover:bg-neutral-50 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-neutral-200"
                    }`}
                    onClick={() => {
                      if (onSelect) {
                        onSelect(product, v);
                      }
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
                      <div className="mb-1 line-clamp-1 font-medium text-neutral-900">
                        {v.name || product.name}
                      </div>
                      <div className="mb-1 text-xs text-neutral-500">
                        Cod: {v.product_cod}
                      </div>
                      <div className="mb-1 text-xs text-neutral-500">
                        Estoque: {v.stock ?? 0}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
