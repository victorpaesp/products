import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { normalizeImageUrl } from "~/lib/utils";
import type { ImageCarouselProps } from "~/types/components";

export function ImageCarousel({
  images,
  productName,
  mainImage,
}: ImageCarouselProps) {
  let validImages: string[] = Array.isArray(images)
    ? images
        .filter((img) => typeof img === "string" && img.trim() !== "")
        .map((img) => normalizeImageUrl(img))
    : [];

  validImages = validImages.filter((img, idx, arr) => arr.indexOf(img) === idx);

  if (validImages.length === 0) {
    validImages = ["/logo-santomimo.png"];
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const nextImage = () => {
    setIsLoading(true);
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = () => {
    setIsLoading(true);
    setCurrentImageIndex(
      (prev) => (prev - 1 + validImages.length) % validImages.length,
    );
  };

  return (
    <div className="mb-6 relative">
      <div className="relative h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
        <img
          key={currentImageIndex}
          src={validImages[currentImageIndex]}
          alt={`${productName} - Imagem ${currentImageIndex + 1}`}
          className={`w-full h-full object-contain rounded-lg ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = "/logo-santomimo.png";
            setIsLoading(false);
          }}
        />

        {validImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsLoading(true);
                setCurrentImageIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex ? "bg-black" : "bg-gray-300"
              }`}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
