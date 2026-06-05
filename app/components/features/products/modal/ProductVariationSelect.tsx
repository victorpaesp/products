import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { Product, Variation } from "~/types/index";
import {
  cn,
  getAllProductVariations,
  getProductColorSelectOptions,
  getProductVariationCount,
  getVariationDifference,
  getVariationImage,
  normalizeImageUrl,
} from "~/lib/utils";

type VariationSelectOption = {
  id: string;
  label: string;
  variation: Variation;
};

function buildVariationSelectOptions(product: Product): VariationSelectOption[] {
  const colorOptions = getProductColorSelectOptions(product);

  if (colorOptions.length > 0) {
    return colorOptions
      .map((option) => {
        const variation = option.variations[0];
        if (!variation) return null;
        return {
          id: option.id,
          label: option.label,
          variation,
        };
      })
      .filter((option): option is VariationSelectOption => option != null);
  }

  const allVariations = getAllProductVariations(product) as Variation[];

  if (allVariations.length > 0) {
    return allVariations.map((variation) => ({
      id: variation.product_cod,
      label: getVariationDifference(product.name, variation.name),
      variation,
    }));
  }

  return [
    {
      id: product.product_cod,
      label: product.name,
      variation: {
        id: product.id,
        product_id: product.id,
        product_cod: product.product_cod,
        name: product.name,
        price: product.price,
        stock: 0,
        images: [...(product.gallery || [])].filter(Boolean),
      },
    },
  ];
}

function getVariationOptionImage(option: VariationSelectOption, product: Product) {
  return (
    getVariationImage(option.variation) ||
    product.gallery?.[0] ||
    "/logo-santomimo.png"
  );
}

function VariationSelectItem({
  option,
  product,
  isSelected,
  onToggle,
  onHover,
}: {
  option: VariationSelectOption;
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
  onHover: (variation: Variation | null) => void;
}) {
  const imageSrc = normalizeImageUrl(getVariationOptionImage(option, product));

  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors hover:bg-neutral-50",
        isSelected ? "border-primary bg-primary/5" : "border-neutral-200",
      )}
      onClick={onToggle}
      onMouseEnter={() => onHover(option.variation)}
      onMouseLeave={() => onHover(null)}
    >
      <img
        src={imageSrc}
        alt={option.label}
        className="size-16 shrink-0 rounded-md object-cover sm:size-20"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/logo-santomimo.png";
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 line-clamp-1 font-medium text-neutral-900">
          {option.label}
        </div>
        <div className="mb-1 text-xs text-neutral-500">
          Cod: {option.variation.product_cod}
        </div>
        <div className="text-xs text-neutral-500">
          Estoque: {option.variation.stock ?? 0}
        </div>
      </div>
      {isSelected && (
        <Check className="text-primary size-4 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}

export type ProductVariationSelectProps = {
  product: Product;
  selectedVariationCodes: string[];
  onToggleVariation: (variation: Variation) => void;
  onVariationHover?: (variation: Variation | null) => void;
};

export function ProductVariationSelect({
  product,
  selectedVariationCodes,
  onToggleVariation,
  onVariationHover,
}: ProductVariationSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const onVariationHoverRef = useRef(onVariationHover);
  onVariationHoverRef.current = onVariationHover;

  const options = useMemo(
    () => buildVariationSelectOptions(product),
    [product],
  );

  const selectedOptions = options.filter((option) =>
    selectedVariationCodes.includes(option.variation.product_cod),
  );
  const selectedCount = selectedOptions.length;
  const hasMultipleOptions = options.length > 1;
  const triggerOption = selectedOptions[0] ?? options[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        onVariationHoverRef.current?.(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setOpen(false);
    onVariationHoverRef.current?.(null);
  }, [product.id, product.product_cod]);

  const handleToggle = (variation: Variation) => {
    onToggleVariation(variation);

    if (!hasMultipleOptions) {
      setOpen(false);
      onVariationHoverRef.current?.(null);
    }
  };

  const handleTriggerClick = () => {
    if (!hasMultipleOptions) {
      const variation = options[0]?.variation;
      if (variation) handleToggle(variation);
      return;
    }

    setOpen((current) => {
      const next = !current;
      if (!next) onVariationHoverRef.current?.(null);
      return next;
    });
  };

  const isSingleOptionSelected =
    !hasMultipleOptions &&
    options[0] != null &&
    selectedVariationCodes.includes(options[0].variation.product_cod);

  const triggerLabel = hasMultipleOptions
    ? selectedCount === 0
      ? "Selecione uma variação"
      : selectedCount === 1
        ? triggerOption.label
        : `${selectedCount} variações selecionadas`
    : isSingleOptionSelected
      ? "Selecionado"
      : "Selecionar produto";

  const triggerImage = triggerOption
    ? normalizeImageUrl(getVariationOptionImage(triggerOption, product))
    : "/logo-santomimo.png";

  const showVariationCount = getProductVariationCount(product) > 1 && selectedCount > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        aria-haspopup={hasMultipleOptions ? "listbox" : undefined}
        aria-expanded={hasMultipleOptions ? open : undefined}
        className={cn(
          "border-input ring-offset-background focus:ring-ring flex h-auto min-h-9 w-full items-center justify-between gap-3 rounded-md border bg-white px-3 py-2 text-sm shadow-xs focus:ring-1 focus:outline-hidden",
          selectedCount > 0 && "border-primary/40 bg-primary/5",
        )}
        onClick={handleTriggerClick}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <img
            src={triggerImage}
            alt=""
            className="size-10 shrink-0 rounded-md object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/logo-santomimo.png";
            }}
          />
          <span className="min-w-0">
            <span className="line-clamp-1 font-medium text-neutral-900">
              {triggerLabel}
            </span>
            {((hasMultipleOptions && selectedCount === 1) ||
              !hasMultipleOptions) &&
              triggerOption && (
              <span className="line-clamp-1 text-xs text-neutral-500">
                Cod: {triggerOption.variation.product_cod} · Estoque:{" "}
                {triggerOption.variation.stock ?? 0}
              </span>
            )}
          </span>
        </span>
        {hasMultipleOptions ? (
          <span className="relative ml-2 size-4 shrink-0 text-neutral-500">
            {open ? (
              <ChevronUp className="size-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-4" aria-hidden="true" />
            )}
          </span>
        ) : isSingleOptionSelected ? (
          <Check className="text-primary size-4 shrink-0" aria-hidden="true" />
        ) : null}
        {showVariationCount && selectedCount > 1 && (
          <span className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex size-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none">
            {selectedCount}
          </span>
        )}
      </button>

      {open && hasMultipleOptions && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+0.25rem)] z-50 max-h-80 w-full overflow-y-auto rounded-md border bg-white p-2 shadow-md"
        >
          <div className="space-y-2">
            {options.map((option) => {
              const isSelected = selectedVariationCodes.includes(
                option.variation.product_cod,
              );

              return (
                <VariationSelectItem
                  key={option.id}
                  option={option}
                  product={product}
                  isSelected={isSelected}
                  onToggle={() => handleToggle(option.variation)}
                  onHover={(variation) =>
                    onVariationHoverRef.current?.(variation)
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
