import { useEffect, useRef, useState } from "react";
import type { Product } from "~/types/index";
import { X } from "lucide-react";
import { ImageCarousel } from "./ImageCarousel";
import { ProductDetails } from "./ProductDetails";
import { getProductImage } from "~/lib/utils";
import type { ProductModalProps } from "~/types/components";
import { useBodyOverflow } from "~/hooks/useBodyOverflow";

export function ProductModal({
  product,
  isOpen,
  onClose,
  onProductUpdate,
}: ProductModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useBodyOverflow(isMounted);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
      if (event.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      setIsMounted(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isVisible) {
      closeButtonRef.current?.focus();
    } else if (!isMounted) {
      triggerElementRef.current?.focus();
    }
  }, [isMounted, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isMounted) return null;

  const allImages = [getProductImage(product), ...(product.gallery || [])];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`bg-white w-screen h-screen rounded-none shadow-xl flex flex-col overflow-hidden transition-all duration-300 transform sm:w-full sm:max-w-5xl sm:max-h-[90vh] sm:h-auto sm:rounded-lg sm:mx-4 ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 sm:translate-y-4"
        }`}
      >
        <div className="p-4 sm:p-6 flex items-center sticky top-0 bg-white z-10 border-b border-gray-100">
          {/* Title */}
          <h1 id="modal-title" className="text-lg font-semibold">
            Detalhes do Produto
          </h1>
          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-gray-200 text-gray-700 z-10 ml-auto"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col sm:flex-row gap-6 sm:gap-8">
          <ImageCarousel images={allImages} productName={product.name} />
          <ProductDetails product={product} onProductUpdate={onProductUpdate} />
        </div>
      </div>
    </div>
  );
}
