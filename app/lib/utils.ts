import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: string) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parsePrice(price));
};

export const parsePrice = (val: string | number): number => {
  if (typeof val === "number") return val;

  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(val)) {
    return Number(val.replace(/\./g, "").replace(",", "."));
  }

  if (/^\d{1,3}(,\d{3})*\.\d{2}$/.test(val)) {
    return Number(val.replace(/,/g, ""));
  }

  return Number(val.replace(",", "."));
};

export const removeHtmlTags = (text: string): string => {
  return text.replace(/<[^>]*>/g, "");
};

/**
 * Obtém a URL da imagem correta do produto baseado no Provider
 * Para "MinhaXBZ", usa Gallery[1] se existir, caso contrário usa Image
 * @param product O produto
 * @returns URL da imagem
 */
export const getProductImage = (product: {
  Provider: string;
  Image: string;
  Gallery?: string[];
}): string => {
  if (
    product.Provider === "MinhaXBZ" &&
    product.Gallery &&
    product.Gallery.length > 1
  ) {
    return product.Gallery[1];
  }
  return product.Image;
};
