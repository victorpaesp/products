import { useEffect, useRef, useState } from "react";
import type { Product } from "~/types/index";
import { X } from "lucide-react";
import { ImageCarousel } from "./atoms/ImageCarousel";
import { ProductDetails } from "./atoms/ProductDetails";
import { getProductImage } from "~/lib/utils";

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
      if (event.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

  // Handle mount/unmount and visibility
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Small delay to allow the DOM to update before starting the animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      // Wait for the fade-out animation to complete before unmounting
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300); // Match this with the transition duration in CSS
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isVisible) {
      closeButtonRef.current?.focus();
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for the fade-out animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Match this with the transition duration in CSS
  };

  if (!isMounted) return null;

  const allImages = [getProductImage(product), ...(product.Gallery || [])];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
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
        className={`relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-black text-white z-10"
          aria-label="Fechar modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <ImageCarousel images={allImages} productName={product.Name} />
          <ProductDetails product={product} />
        </div>
      </div>
    </div>
  );
}
