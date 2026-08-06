import type { Product } from "~/types";

export function normalizeDescriptionOverride(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

export function getOriginalProductDescription(product: Product): string {
  return (
    product.description_original?.trim() || product.description?.trim() || ""
  );
}

export function getEffectiveProductDescription(product: Product): string {
  return (
    normalizeDescriptionOverride(product.description_override) ??
    getOriginalProductDescription(product)
  );
}

export function hasProductDescriptionOverride(product: Product): boolean {
  return normalizeDescriptionOverride(product.description_override) !== null;
}
