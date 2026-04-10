import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { FreeMode, Mousewheel, Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { normalizeImageUrl } from "~/lib/utils";
import type { ImageCarouselProps } from "~/types/components";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

export function ImageCarousel({
  images,
  productName,
  mainImage,
}: ImageCarouselProps) {
  const validImages = useMemo(() => {
    let normalizedImages: string[] = Array.isArray(images)
      ? images
          .filter((img) => typeof img === "string" && img.trim() !== "")
          .map((img) => normalizeImageUrl(img))
      : [];

    if (typeof mainImage === "string" && mainImage.trim() !== "") {
      normalizedImages = [normalizeImageUrl(mainImage), ...normalizedImages];
    }

    const dedupedImages = normalizedImages.filter(
      (img, idx, arr) => arr.indexOf(img) === idx,
    );

    if (dedupedImages.length === 0) {
      return ["/logo-santomimo.png"];
    }

    return dedupedImages;
  }, [images, mainImage]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const getImageSrc = (index: number) => {
    if (imageErrors[index]) return "/logo-santomimo.png";
    return validImages[index] ?? "/logo-santomimo.png";
  };

  const currentImageSrc = getImageSrc(currentImageIndex);

  useEffect(() => {
    if (currentImageIndex >= validImages.length) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, validImages.length]);

  useEffect(() => {
    if (!thumbsSwiper || thumbsSwiper.destroyed) return;
    thumbsSwiper.slideTo(currentImageIndex);
  }, [currentImageIndex, thumbsSwiper]);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);

    const preloader = new Image();
    preloader.src = currentImageSrc;

    const handleLoaded = () => {
      if (!cancelled) {
        setIsLoading(false);
      }
    };

    const handleError = () => {
      if (cancelled) return;

      setImageErrors((prev) => ({
        ...prev,
        [currentImageIndex]: true,
      }));

      setIsLoading(false);
    };

    if (preloader.complete && preloader.naturalWidth > 0) {
      handleLoaded();
    } else {
      preloader.onload = handleLoaded;
      preloader.onerror = handleError;
    }

    return () => {
      cancelled = true;
      preloader.onload = null;
      preloader.onerror = null;
    };
  }, [currentImageIndex, currentImageSrc]);

  const nextImage = () => {
    if (!mainSwiper) return;
    setIsLoading(true);
    mainSwiper.slideNext();
  };

  const prevImage = () => {
    if (!mainSwiper) return;
    setIsLoading(true);
    mainSwiper.slidePrev();
  };

  return (
    <div className="w-full sm:w-1/2 min-w-0 flex flex-col gap-2">
      <div className="relative w-full rounded-lg flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
        <Swiper
          modules={[Navigation, Thumbs]}
          loop={validImages.length > 1}
          navigation={false}
          onSwiper={setMainSwiper}
          onSlideChange={(swiper) => {
            const nextIndex = swiper.realIndex;
            setCurrentImageIndex(nextIndex);
          }}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
            autoScrollOffset: 1,
          }}
          className="w-full h-full"
        >
          {validImages.map((imageUrl, index) => (
            <SwiperSlide key={imageUrl + index}>
              <img
                src={getImageSrc(index)}
                alt={`${productName} - Imagem ${index + 1}`}
                onError={() =>
                  setImageErrors((prev) => ({ ...prev, [index]: true }))
                }
                className={`w-full h-full object-contain rounded-lg ${
                  isLoading && index === currentImageIndex
                    ? "opacity-0"
                    : "opacity-100"
                }`}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-xl bg-white p-2 text-gray-700 hover:bg-gray-200"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-xl bg-white p-2 text-gray-700 hover:bg-gray-200"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="flex justify-center">
          <Swiper
            modules={[FreeMode, Thumbs, Mousewheel]}
            onSwiper={setThumbsSwiper}
            spaceBetween={8}
            slidesPerView="auto"
            centerInsufficientSlides
            freeMode
            watchSlidesProgress
            mousewheel={{ forceToAxis: true }}
            className="h-12 w-full max-w-[328px]"
          >
            {validImages.map((imageUrl, index) => (
              <SwiperSlide key={imageUrl + index} className="!w-12">
                <button
                  type="button"
                  onClick={() => {
                    if (!mainSwiper || index === currentImageIndex) return;
                    mainSwiper.slideToLoop(index);
                  }}
                  className={`w-12 h-12 overflow-hidden rounded-md border transition-all ${
                    index === currentImageIndex
                      ? "border-black"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                  aria-label={`Ir para imagem ${index + 1}`}
                >
                  <img
                    src={getImageSrc(index)}
                    alt={`${productName} - Miniatura ${index + 1}`}
                    onError={() =>
                      setImageErrors((prev) => ({ ...prev, [index]: true }))
                    }
                    className="w-full h-full object-cover"
                  />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}
