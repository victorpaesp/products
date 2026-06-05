import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { FreeMode, Mousewheel, Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { normalizeImageUrl, cn } from "~/lib/utils";
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
  const [thumbsAtStart, setThumbsAtStart] = useState(true);
  const [thumbsAtEnd, setThumbsAtEnd] = useState(false);
  const loadRequestIdRef = useRef(0);

  const updateThumbsEdges = (swiper: SwiperType) => {
    setThumbsAtStart(swiper.isBeginning);
    setThumbsAtEnd(swiper.isEnd);
  };

  const goToImage = (index: number) => {
    if (!mainSwiper || mainSwiper.destroyed) return;

    setCurrentImageIndex(index);

    if (validImages.length > 1) {
      mainSwiper.slideToLoop(index);
    } else {
      mainSwiper.slideTo(index);
    }
  };

  const getImageSrc = (index: number) => {
    if (imageErrors[index]) return "/logo-santomimo.png";
    return validImages[index] ?? "/logo-santomimo.png";
  };

  const currentImageSrc = getImageSrc(currentImageIndex);

  const validImagesKey = validImages.join("\0");

  const thumbMaskStyle = useMemo((): CSSProperties => {
    if (thumbsAtStart && thumbsAtEnd) return {};

    const fade = "2.5rem";

    if (thumbsAtStart) {
      return {
        maskImage: `linear-gradient(to right, black calc(100% - ${fade}), transparent)`,
        WebkitMaskImage: `linear-gradient(to right, black calc(100% - ${fade}), transparent)`,
      };
    }

    if (thumbsAtEnd) {
      return {
        maskImage: `linear-gradient(to right, transparent, black ${fade})`,
        WebkitMaskImage: `linear-gradient(to right, transparent, black ${fade})`,
      };
    }

    return {
      maskImage: `linear-gradient(to right, transparent, black ${fade}, black calc(100% - ${fade}), transparent)`,
      WebkitMaskImage: `linear-gradient(to right, transparent, black ${fade}, black calc(100% - ${fade}), transparent)`,
    };
  }, [thumbsAtStart, thumbsAtEnd]);

  useEffect(() => {
    if (currentImageIndex >= validImages.length) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, validImages.length]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setImageErrors({});
  }, [mainImage, validImagesKey]);

  useEffect(() => {
    if (!mainSwiper || mainSwiper.destroyed) return;

    if (validImages.length > 1) {
      mainSwiper.slideToLoop(0, 0);
    } else {
      mainSwiper.slideTo(0, 0);
    }
  }, [mainImage, validImagesKey, mainSwiper, validImages.length]);

  useEffect(() => {
    if (!thumbsSwiper || thumbsSwiper.destroyed) return;
    thumbsSwiper.slideTo(currentImageIndex);
    requestAnimationFrame(() => updateThumbsEdges(thumbsSwiper));
  }, [currentImageIndex, thumbsSwiper]);

  useEffect(() => {
    const requestId = ++loadRequestIdRef.current;

    setIsLoading(true);

    const preloader = new Image();
    preloader.src = currentImageSrc;

    const finishLoading = (failed = false) => {
      if (requestId !== loadRequestIdRef.current) return;

      if (failed) {
        setImageErrors((prev) => ({
          ...prev,
          [currentImageIndex]: true,
        }));
      }

      setIsLoading(false);
    };

    if (preloader.complete) {
      finishLoading();
    } else {
      preloader.onload = () => finishLoading();
      preloader.onerror = () => finishLoading(true);
    }

    return () => {
      preloader.onload = null;
      preloader.onerror = null;
    };
  }, [currentImageIndex, currentImageSrc, mainImage, validImagesKey]);

  const nextImage = () => {
    if (!mainSwiper) return;
    mainSwiper.slideNext();
  };

  const prevImage = () => {
    if (!mainSwiper) return;
    mainSwiper.slidePrev();
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:w-1/2">
      <div className="relative flex w-full items-center justify-center rounded-lg">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        )}
        <Swiper
          modules={[Navigation, Thumbs]}
          loop={validImages.length > 1}
          navigation={false}
          onSwiper={setMainSwiper}
          onSlideChange={(swiper) => {
            setCurrentImageIndex(swiper.realIndex);
          }}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
            autoScrollOffset: 1,
          }}
          className="h-full w-full"
        >
          {validImages.map((imageUrl, index) => (
            <SwiperSlide key={imageUrl + index}>
              <img
                src={getImageSrc(index)}
                alt={`${productName} - Imagem ${index + 1}`}
                onError={() =>
                  setImageErrors((prev) => ({ ...prev, [index]: true }))
                }
                className={`h-full w-full rounded-lg border border-neutral-200 object-contain ${
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
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={prevImage}
              className="absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-xl"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={nextImage}
              className="absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-xl"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="mx-auto w-full max-w-[328px]">
          <div className="relative overflow-hidden" style={thumbMaskStyle}>
            <Swiper
              modules={[FreeMode, Thumbs, Mousewheel]}
              onSwiper={(swiper) => {
                setThumbsSwiper(swiper);
                updateThumbsEdges(swiper);
              }}
              onSlideChange={updateThumbsEdges}
              onResize={updateThumbsEdges}
              onReachBeginning={() => setThumbsAtStart(true)}
              onReachEnd={() => setThumbsAtEnd(true)}
              onFromEdge={updateThumbsEdges}
              spaceBetween={8}
              slidesPerView="auto"
              centerInsufficientSlides
              freeMode
              watchSlidesProgress
              mousewheel={{ forceToAxis: true }}
              className="h-12 w-full"
            >
              {validImages.map((imageUrl, index) => (
                <SwiperSlide key={imageUrl + index} className="w-12!">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (index === currentImageIndex) return;
                      goToImage(index);
                    }}
                    className={cn(
                      "h-12 w-12 overflow-hidden rounded-md border p-0 transition-all",
                      index === currentImageIndex
                        ? "border-black"
                        : "border-neutral-300 hover:border-neutral-500",
                    )}
                    aria-label={`Ir para imagem ${index + 1}`}
                    aria-current={
                      index === currentImageIndex ? "true" : undefined
                    }
                  >
                    <img
                      src={getImageSrc(index)}
                      alt={`${productName} - Miniatura ${index + 1}`}
                      onError={() =>
                        setImageErrors((prev) => ({ ...prev, [index]: true }))
                      }
                      className="h-full w-full object-cover"
                    />
                  </Button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {validImages.length > 6 && (
            <p className="mt-1.5 text-center text-xs text-neutral-500">
              {currentImageIndex + 1} de {validImages.length} imagens
            </p>
          )}
        </div>
      )}
    </div>
  );
}
