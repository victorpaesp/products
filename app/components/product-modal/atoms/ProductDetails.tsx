import type { Product } from "~/types/index";
import { formatPrice } from "~/lib/utils";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <div className="space-y-4">
      <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
        {product.product_cod} - {product.name}
      </h2>

      <div className="text-gray-600">
        <p className="mb-4">{product.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Preço</p>
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </p>
          </div>

          {product.product_weight && (
            <div>
              <p className="text-sm text-gray-500">Peso</p>
              <p className="text-xl font-bold text-gray-900">
                {product.product_weight}
              </p>
            </div>
          )}

          {product.quantity_box && (
            <div>
              <p className="text-sm text-gray-500">Quantidade por Caixa</p>
              <p className="text-xl font-bold text-gray-900">
                {product.quantity_box}
              </p>
            </div>
          )}
        </div>

        {product.variations && product.variations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Variações</p>
            <div className="flex flex-wrap gap-2">
              {product.variations.map((variation, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {variation.name} - Estoque: {variation.stock} -{" "}
                  {formatPrice(variation.price)}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.product_mention && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Menção</p>
            <p className="text-gray-900">{product.product_mention}</p>
          </div>
        )}

        {product.box_mention && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Menção da Caixa</p>
            <p className="text-gray-900">{product.box_mention}</p>
          </div>
        )}
      </div>
    </div>
  );
}
