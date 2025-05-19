import type { Product } from "~/types/index";
import { formatPrice } from "~/lib/utils";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <div className="space-y-4">
      <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
        {product.Name}
      </h2>

      <div className="text-gray-600">
        <p className="mb-4">{product.Description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Preço</p>
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(product.Price)}
            </p>
          </div>

          {product.Product_Weight && (
            <div>
              <p className="text-sm text-gray-500">Peso</p>
              <p className="text-xl font-bold text-gray-900">
                {product.Product_Weight}
              </p>
            </div>
          )}

          {product.Quantity_Box && (
            <div>
              <p className="text-sm text-gray-500">Quantidade por Caixa</p>
              <p className="text-xl font-bold text-gray-900">
                {product.Quantity_Box}
              </p>
            </div>
          )}
        </div>

        {product.variation && product.variation.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Variações</p>
            <div className="flex flex-wrap gap-2">
              {product.variation.map((variation, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {variation.Name} - Estoque: {variation.Stock} -{" "}
                  {formatPrice(variation.Price)}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.Product_Mention && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Menção</p>
            <p className="text-gray-900">{product.Product_Mention}</p>
          </div>
        )}

        {product.Box_Mention && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Menção da Caixa</p>
            <p className="text-gray-900">{product.Box_Mention}</p>
          </div>
        )}
      </div>
    </div>
  );
}
