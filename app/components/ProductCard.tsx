import { useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import type { Product } from "~/types/index";
import { formatPrice, getProductImage } from "~/lib/utils";
import { ProductModal } from "./product-modal/ProductModal";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  isSelected?: boolean;
}

export function ProductCard(props: ProductCardProps) {
  const { product, isSelected, onSelect } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const imageSrc = getProductImage(product);

  return (
    <>
      <div
        className="bg-white flex flex-col rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative"
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsModalOpen(true);
          }
        }}
      >
        <label
          htmlFor="product-checkbox"
          className="absolute top-4 right-4 md:top-2 md:right-2 flex items-center justify-center cursor-pointer"
        >
          <Checkbox
            checked={isSelected}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              if (onSelect) {
                onSelect(product);
              }
            }}
            className="size-10 md:size-6 bg-white dark:bg-[#3b3b3b] rounded-xl md:rounded-md border-gray-700"
          />
        </label>
        <div className="aspect-square">
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4 h-full flex flex-col">
          <h2 className="text-lg text-gray-900 font-semibold mb-2 line-clamp-1">
            {product.product_cod} - {product.name}
          </h2>
          <p className="text-gray-900 text-sm line-clamp-2 mb-2">
            {product.description}
          </p>
          <p className="text-lg font-bold text-gray-900 mt-auto">
            {formatPrice(product.price)}
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
