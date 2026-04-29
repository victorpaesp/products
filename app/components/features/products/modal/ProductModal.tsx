import type { ProductModalProps } from "~/types/components";
import { ImageCarousel } from "./ImageCarousel";
import { ProductDetails } from "./ProductDetails";
import { getProductImage } from "~/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

export function ProductModal({
  product,
  isOpen,
  onClose,
  onProductUpdate,
}: ProductModalProps) {
  const allImages = [getProductImage(product), ...(product.gallery || [])];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="flex h-screen w-screen max-w-none flex-col gap-0 rounded-none p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-lg"
      >
        <div className="flex items-center border-b border-gray-100 p-4 sm:p-6">
          <DialogTitle className="text-lg font-semibold">
            Detalhes do Produto
          </DialogTitle>
        </div>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:flex-row sm:gap-8 sm:p-6">
          <ImageCarousel images={allImages} productName={product.name} />
          <ProductDetails product={product} onProductUpdate={onProductUpdate} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
