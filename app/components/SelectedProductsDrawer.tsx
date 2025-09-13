import { useState } from "react";
import { X, Download, Trash2 } from "lucide-react";
import { Product } from "~/types";
import { formatPrice } from "~/lib/utils";
import { useProductExport } from "~/hooks/useProductExport";
import { useBodyOverflow } from "~/hooks/useBodyOverflow";
import { ExportToast } from "./ExportToast";
import { QuantityInput } from "~/components/ui/quantity-input";

interface SelectedProductsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onRemoveProduct: (productCod: string) => void;
  onClearProducts?: () => void;
}

export function SelectedProductsDrawer({
  isOpen,
  onClose,
  selectedProducts,
  onRemoveProduct,
  onClearProducts,
}: SelectedProductsDrawerProps) {
  const { exportToast, exportProducts, resetExportState } = useProductExport();
  const [productQuantities, setproductQuantities] = useState<
    Record<string, number>
  >({});

  useBodyOverflow(isOpen);

  const handleExport = async () => {
    const productsToExport = selectedProducts.filter((product) => {
      const stock =
        product.variation && product.variation.length > 0
          ? product.variation[0].Stock ?? 0
          : 9999;
      return stock > 0;
    });
    await exportProducts(
      productsToExport,
      onClearProducts ? () => onClearProducts() : undefined,
      productQuantities
    );
    setproductQuantities({});
  };
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Fechar drawer"
      />

      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[425px] bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Produtos selecionados
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 dark:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {selectedProducts.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
              <p>Nenhum produto selecionado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedProducts.map((product) => {
                const stock =
                  product.variation && product.variation.length > 0
                    ? product.variation[0].Stock ?? 0
                    : 9999;
                const isOutOfStock = stock === 0;
                return (
                  <div
                    key={product.ProductCod}
                    className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-950"
                  >
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(
                        product.Image
                      )}`}
                      alt={product.Name}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/logo.jpeg";
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {product.Name}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Cod: {product.ProductCod} - Estoque: {stock}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center justify-between mt-2">
                        {isOutOfStock ? (
                          <span className="text-red-500 font-semibold">
                            Produto sem estoque
                          </span>
                        ) : (
                          <>
                            <QuantityInput
                              value={productQuantities[product.ProductCod] ?? 1}
                              onChange={(val) =>
                                setproductQuantities((q) => ({
                                  ...q,
                                  [product.ProductCod]: val,
                                }))
                              }
                              max={stock}
                            />
                            <p className="text-gray-900 dark:text-white mt-1">
                              {formatPrice(product.Price)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveProduct(product.ProductCod)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-900 rounded-full transition-colors flex-shrink-0"
                      title="Remover produto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedProducts.length > 0 && (
          <div className="flex-shrink-0 flex flex-col gap-2 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 
                  bg-black hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-900 text-white"
            >
              <Download className="h-5 w-5" />
              {`Exportar (${selectedProducts.length} ${
                selectedProducts.length === 1 ? "produto" : "produtos"
              })`}
            </button>
            {selectedProducts.length && (
              <button
                onClick={onClearProducts}
                className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 bg-red-500 hover:bg-red-600 text-white"
                type="button"
              >
                <Trash2 className="h-5 w-5" />
                Limpar seleção
              </button>
            )}
          </div>
        )}
      </div>

      <ExportToast
        isVisible={exportToast.isVisible}
        status={exportToast.status}
        message={exportToast.message}
        onClose={resetExportState}
      />
    </>
  );
}
