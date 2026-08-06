import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  cn,
  getProductCarouselImages,
  handleImageLoadError,
  normalizeImageUrl,
} from "~/lib/utils";
import type { Product } from "~/types";

type ProductEditorOverviewProps = {
  product: Product;
};

function flattenImageValues(values: unknown[]): string[] {
  return values.flatMap((value) => {
    if (Array.isArray(value)) return flattenImageValues(value);
    return typeof value === "string" && value.trim() ? [value] : [];
  });
}

function getAdminProductImages(product: Product) {
  const productImages = getProductCarouselImages(product);
  const variationImages = flattenImageValues(
    (product.variations ?? []).flatMap((variation) => variation.images ?? []),
  );

  const images = Array.from(
    new Set(
      [...productImages, ...variationImages]
        .filter((image) => typeof image === "string" && image.trim() !== "")
        .map((image) => normalizeImageUrl(image)),
    ),
  );

  return images.length ? images : [normalizeImageUrl()];
}

export function ProductEditorOverview({ product }: ProductEditorOverviewProps) {
  const images = getAdminProductImages(product);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex];

  const showPreviousImage = () => {
    setCurrentIndex((index) => (index - 1 + images.length) % images.length);
  };

  const showNextImage = () => {
    setCurrentIndex((index) => (index + 1) % images.length);
  };

  return (
    <aside
      aria-label="Imagens do produto"
      className="bg-muted/30 flex flex-col gap-4 p-4 lg:sticky lg:top-0 lg:self-start lg:border-r lg:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Imagens do produto</h2>
          <p className="text-muted-foreground text-xs">
            Produto, galeria e variações.
          </p>
        </div>
        <Badge variant="outline" className="tabular-nums">
          {images.length}
        </Badge>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="bg-background relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border">
          <img
            src={currentImage}
            alt={`${product.name} — imagem ${currentIndex + 1}`}
            className="size-full object-contain"
            onError={handleImageLoadError}
          />

          {images.length > 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full shadow-sm"
                onClick={showPreviousImage}
                aria-label="Imagem anterior"
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full shadow-sm"
                onClick={showNextImage}
                aria-label="Próxima imagem"
              >
                <ChevronRight />
              </Button>
            </>
          ) : null}
        </div>

        {images.length > 1 ? (
          <>
            <div
              className="flex w-full gap-2 overflow-x-auto pb-1"
              aria-label="Miniaturas das imagens do produto"
            >
              {images.map((image, index) => (
                <Button
                  key={`${image}-${index}`}
                  type="button"
                  variant="ghost"
                  className={cn(
                    "bg-background size-12 shrink-0 overflow-hidden rounded-md border p-0",
                    index === currentIndex
                      ? "border-primary ring-primary/20 ring-2"
                      : "border-border opacity-70 hover:opacity-100",
                  )}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Exibir imagem ${index + 1}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                >
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                    onError={handleImageLoadError}
                  />
                </Button>
              ))}
            </div>
            <p className="text-muted-foreground text-center text-xs tabular-nums">
              {currentIndex + 1} de {images.length}
            </p>
          </>
        ) : null}
      </div>
    </aside>
  );
}
