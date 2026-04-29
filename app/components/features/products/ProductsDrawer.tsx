import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { formatPrice, getProductImage } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { useProductExport } from "~/hooks/useProductExport";
import { useBodyOverflow } from "~/hooks/useBodyOverflow";
import { ExportToast } from "./ExportToast";
import { ExportProposalModal } from "./ExportProposalModal";

import type {
  ExportProposalData,
  ProductsDrawerProps,
} from "~/types/components";

export function ProductsDrawer({
  isOpen,
  onClose,
  selectedProducts,
  onRemoveProduct,
  onClearProducts,
}: ProductsDrawerProps) {
  const { exportToast, exportProducts, resetExportState } = useProductExport();
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  useBodyOverflow(isOpen);

  const handleExportClick = () => {
    setExportModalOpen(true);
  };

  const handleExportSubmit = async (formData: ExportProposalData) => {
    const productsToExport = selectedProducts.map(({ product, variation }) => {
      const isSingleVariation =
        product.variations && product.variations.length === 1;
      if (isSingleVariation) {
        return {
          ...product,
          name: product.name,
          product_cod: product.product_cod,
          price: product.price,
          images: product.gallery,
          stock: product.variations?.[0]?.stock ?? 0,
          description: product.description,
          gallery: product.gallery,
        };
      } else {
        let exportImages;
        if (Array.isArray(variation.images?.[0])) {
          exportImages = variation.images[0];
        } else if (variation.images?.length) {
          exportImages = variation.images;
        } else {
          exportImages = product.gallery;
        }
        return {
          ...product,
          ...variation,
          name: variation.name || product.name,
          product_cod: variation.product_cod,
          price: variation.price ?? product.price,
          images: exportImages,
          stock: variation.stock ?? 0,
          description: product.description,
          gallery: product.gallery,
        };
      }
    });

    await exportProducts(
      productsToExport,
      onClearProducts ? () => onClearProducts() : undefined,
      formData.contact,
      formData.company,
      formData.description,
    );

    setExportModalOpen(false);
  };
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
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
        className={`fixed top-0 right-0 z-50 flex h-full w-full transform flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out sm:w-[425px] dark:bg-gray-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Produtos selecionados
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5 dark:text-white" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {selectedProducts.length === 0 ? (
            <div className="mt-10 text-center text-gray-500 dark:text-gray-400">
              <p>Nenhum produto selecionado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedProducts.map(({ product, variation }) => {
                const isSingleVariation =
                  product.variations && product.variations.length === 1;
                let name, code, price, image, stock;
                if (isSingleVariation) {
                  name = product.name;
                  code = product.product_cod;
                  price = product.price;
                  image = product.gallery?.[0] || getProductImage(product);
                  stock = product.variations?.[0]?.stock ?? 0;
                } else {
                  name = variation.name || product.name;
                  code = variation.product_cod;
                  price = variation.price ?? product.price;
                  image = Array.isArray(variation.images?.[0])
                    ? variation.images[0][0] || getProductImage(product)
                    : variation.images?.[0] || getProductImage(product);
                  stock = variation.stock ?? 0;
                }
                return (
                  <div
                    key={product.product_cod + "-" + variation.product_cod}
                    className="flex items-start gap-3 rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <img
                      src={image}
                      alt={name}
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/logo-santomimo.png";
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div>
                        <h3 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                          {name}
                        </h3>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          Cod: {code} - Estoque: {stock}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {formatPrice(price)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onRemoveProduct(product.product_cod, code);
                      }}
                      className="shrink-0 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-gray-900"
                      title="Remover produto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedProducts.length > 0 && (
          <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-950">
            <Button onClick={handleExportClick}>
              Continuar para exportação
            </Button>
            <ExportProposalModal
              open={isExportModalOpen}
              onOpenChange={setExportModalOpen}
              onSubmit={handleExportSubmit}
            />
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
