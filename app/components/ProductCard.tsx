import { useState } from "react";
import type { Product } from "~/types/index";
import { formatPrice } from "~/lib/utils";
import { ProductModal } from "./product-modal/ProductModal";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative"
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsModalOpen(true);
          }
        }}
      >
        <input
          type="checkbox"
          className="absolute top-2 right-2 w-5 h-5 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation(); // Prevents triggering the modal
            if (onSelect) {
              onSelect(product);
            }
          }} // Prevents triggering the modal
        />
        <div className="aspect-square">
          <img
            src={product.Image}
            alt={product.Name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <h2 className="text-lg text-gray-900 font-semibold mb-2 line-clamp-1">
            {product.Name}
          </h2>
          <p className="text-gray-900 text-sm line-clamp-2 mb-2">
            {product.Description}
          </p>
          <p className="text-lg font-bold text-gray-900">
            {formatPrice(product.Price)}
          </p>
        </div>
      </div>

      <ProductModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
