import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { SelectedProduct } from "~/types";

export const SELECTED_PRODUCTS_STORAGE_KEY = "selectedProducts";

export function clearSelectedProductsStorage(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SELECTED_PRODUCTS_STORAGE_KEY);
}

function readSelectedProductsFromStorage(): SelectedProduct[] {
  if (typeof window === "undefined") return [];

  const saved = sessionStorage.getItem(SELECTED_PRODUCTS_STORAGE_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as SelectedProduct[];
  } catch (error) {
    console.error("Erro ao carregar produtos selecionados:", error);
    clearSelectedProductsStorage();
    return [];
  }
}

function writeSelectedProductsToStorage(selectedProducts: SelectedProduct[]) {
  if (typeof window === "undefined") return;

  if (selectedProducts.length === 0) {
    clearSelectedProductsStorage();
    return;
  }

  sessionStorage.setItem(
    SELECTED_PRODUCTS_STORAGE_KEY,
    JSON.stringify(selectedProducts),
  );
}

export function useSelectedProducts(isAuthenticated: boolean) {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [isHydrated, setIsHydrated] = useState(false);

  const clearSelectedProducts = useCallback(() => {
    setSelectedProducts([]);
    clearSelectedProductsStorage();
  }, []);

  useLayoutEffect(() => {
    if (!isAuthenticated) {
      setSelectedProducts([]);
      clearSelectedProductsStorage();
      setIsHydrated(true);
      return;
    }

    setSelectedProducts(readSelectedProductsFromStorage());
    setIsHydrated(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    writeSelectedProductsToStorage(selectedProducts);
  }, [selectedProducts, isHydrated, isAuthenticated]);

  return { selectedProducts, setSelectedProducts, clearSelectedProducts };
}
