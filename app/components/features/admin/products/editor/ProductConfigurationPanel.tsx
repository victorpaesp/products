import { Boxes, Package, Ruler, Tag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  formatBoxWeight,
  formatNumberWithoutUnnecessaryDecimals,
  formatPrice,
  formatWeight,
  getSupplierDisplayName,
  hasNonZeroNumber,
  parseDimensions,
} from "~/lib/utils";
import type { Product, Variation } from "~/types";
import { ProductDescriptionSection } from "./sections/description/ProductDescriptionSection";
import { ProductCategoriesSection } from "./sections/categories/ProductCategoriesSection";

type ProductConfigurationPanelProps = {
  product: Product;
  token: string;
  onDirtyChange: (dirty: boolean) => void;
};

type ProductDataItemProps = {
  label: string;
  value: string | number;
};

function ProductDataItem({ label, value }: ProductDataItemProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="text-sm font-medium wrap-break-word">{value}</p>
    </div>
  );
}

function getVariations(product: Product): Variation[] {
  const variations = product.variations ?? [];
  const selected = product.selected_variation;

  if (
    !selected ||
    variations.some((variation) => variation.id === selected.id)
  ) {
    return variations;
  }

  return [selected, ...variations];
}

export function ProductConfigurationPanel({
  product,
  token,
  onDirtyChange,
}: ProductConfigurationPanelProps) {
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const [categoriesDirty, setCategoriesDirty] = useState(false);
  const handleDescriptionDirty = useCallback(
    (dirty: boolean) => setDescriptionDirty(dirty),
    [],
  );
  const handleCategoriesDirty = useCallback(
    (dirty: boolean) => setCategoriesDirty(dirty),
    [],
  );

  useEffect(() => {
    onDirtyChange(descriptionDirty || categoriesDirty);
  }, [categoriesDirty, descriptionDirty, onDirtyChange]);
  const supplierName =
    getSupplierDisplayName(product.supplier) || "Fornecedor não informado";
  const productWeight = formatWeight(product.product_weight);
  const boxWeight = formatBoxWeight(product.box_weight);
  const productDimensions =
    product.product_mention && hasNonZeroNumber(product.product_mention)
      ? parseDimensions(product.product_mention)
      : [];
  const boxDimensions =
    product.box_mention && hasNonZeroNumber(product.box_mention)
      ? parseDimensions(product.box_mention)
      : [];
  const variations = getVariations(product);
  const hasFiscalData = Boolean(
    product.fiscal_classification_type || product.fiscal_classification_code,
  );
  const hasProductData = Boolean(productWeight || productDimensions.length);
  const hasBoxData = Boolean(
    product.quantity_box || boxWeight || boxDimensions.length,
  );

  return (
    <main className="min-w-0 p-5 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="tabular-nums">
              Cód. {product.product_cod}
            </Badge>
            <Badge variant="secondary" className="max-w-full truncate">
              {supplierName}
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl leading-tight font-semibold">
              {product.name}
            </h2>
            <p className="text-xl font-semibold tabular-nums">
              {formatPrice(product.price)}
            </p>
          </div>
        </header>

        <Separator />

        <section aria-labelledby="configuration-title">
          <div className="mb-4 flex flex-col gap-1">
            <h3 id="configuration-title" className="font-semibold">
              Configuração
            </h3>
            <p className="text-muted-foreground text-sm">
              Campos com ação de editar podem ser substituídos manualmente. Os
              demais são dados recebidos do fornecedor.
            </p>
          </div>
          <ProductDescriptionSection
            product={product}
            onDirtyChange={handleDescriptionDirty}
          />
          <div className="mt-4">
            <ProductCategoriesSection
              productId={product.id}
              token={token}
              onDirtyChange={handleCategoriesDirty}
            />
          </div>
        </section>

        <Accordion
          type="multiple"
          defaultValue={["specifications"]}
          className="flex flex-col gap-3"
        >
          <AccordionItem
            value="specifications"
            className="rounded-lg border px-4"
          >
            <AccordionTrigger className="min-h-12">
              <span className="flex items-center gap-2">
                <Ruler />
                Especificações
                <Badge variant="outline">Somente leitura</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-6">
              {hasFiscalData ? (
                <section className="flex flex-col gap-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <Tag />
                    Classificação fiscal
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {product.fiscal_classification_type ? (
                      <ProductDataItem
                        label="Tipo"
                        value={product.fiscal_classification_type}
                      />
                    ) : null}
                    {product.fiscal_classification_code ? (
                      <ProductDataItem
                        label="Código"
                        value={product.fiscal_classification_code}
                      />
                    ) : null}
                  </div>
                </section>
              ) : null}

              {hasProductData ? (
                <section className="flex flex-col gap-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <Package />
                    Produto
                  </h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {productWeight ? (
                      <ProductDataItem label="Peso" value={productWeight} />
                    ) : null}
                    {productDimensions.map((dimension) => (
                      <ProductDataItem
                        key={`product-${dimension.label}`}
                        label={dimension.label}
                        value={dimension.value}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {hasBoxData ? (
                <section className="flex flex-col gap-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <Boxes />
                    Caixa
                  </h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {product.quantity_box ? (
                      <ProductDataItem
                        label="Quantidade"
                        value={formatNumberWithoutUnnecessaryDecimals(
                          product.quantity_box,
                        )}
                      />
                    ) : null}
                    {boxWeight ? (
                      <ProductDataItem label="Peso" value={boxWeight} />
                    ) : null}
                    {boxDimensions.map((dimension) => (
                      <ProductDataItem
                        key={`box-${dimension.label}`}
                        label={dimension.label}
                        value={dimension.value}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {!hasFiscalData && !hasProductData && !hasBoxData ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma especificação foi enviada para este produto.
                </p>
              ) : null}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="variations" className="rounded-lg border px-4">
            <AccordionTrigger className="min-h-12">
              <span className="flex items-center gap-2">
                <Boxes />
                Variações
                <Badge variant="outline" className="tabular-nums">
                  {variations.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {variations.length ? (
                <ul className="flex flex-col gap-2">
                  {variations.map((variation) => (
                    <li
                      key={variation.id}
                      className="grid grid-cols-2 gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_6rem_7rem]"
                    >
                      <div className="col-span-2 min-w-0 sm:col-span-1">
                        <p className="truncate text-sm font-medium">
                          {variation.name}
                        </p>
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {variation.product_cod}
                        </p>
                      </div>
                      <ProductDataItem
                        label="Estoque"
                        value={variation.stock}
                      />
                      <ProductDataItem
                        label="Preço"
                        value={formatPrice(variation.price)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Este produto não possui variações cadastradas.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </main>
  );
}
