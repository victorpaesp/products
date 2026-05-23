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

export const formatPhoneNumber = (value: string): string => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
      7,
      11,
    )}`;
  }
};

export const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, "");
};

export const formatNumberWithoutUnnecessaryDecimals = (
  value: string | number,
): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);

  if (num % 1 === 0) {
    return Math.floor(num).toString();
  }

  return num.toFixed(2);
};

const DEFAULT_PRODUCT_PLACEHOLDER = "/logo-santomimo.png";

export const normalizeImageUrl = (
  imageUrl?: string | null,
  fallback = DEFAULT_PRODUCT_PLACEHOLDER,
): string => {
  if (!imageUrl || typeof imageUrl !== "string") return fallback;

  const trimmed = imageUrl.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^\/\//.test(trimmed)) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    const firstSegment = trimmed.split("/")[1] ?? "";
    const looksLikeDomain =
      firstSegment.includes(".") && /[a-z]/i.test(firstSegment);

    if (looksLikeDomain) {
      return fallback;
    }

    return trimmed;
  }

  return fallback;
};

/**
 * Obtém a URL da imagem correta do produto baseado no provider
 * Para "MinhaXBZ", usa gallery[1] se existir, caso contrário usa image
 * @param product O produto
 * @returns URL da imagem
 */
export const getProductImage = (product: {
  provider: string;
  image: string;
  gallery?: string[];
}): string => {
  if (
    product.provider === "MinhaXBZ" &&
    Array.isArray(product.gallery) &&
    product.gallery[1]
  ) {
    const img = normalizeImageUrl(product.gallery[1]);
    if (img !== DEFAULT_PRODUCT_PLACEHOLDER) return img;
  }

  if (Array.isArray(product.gallery)) {
    const img = normalizeImageUrl(product.gallery[0]);
    if (img !== DEFAULT_PRODUCT_PLACEHOLDER) return img;
  }

  if (product.image) {
    const img = normalizeImageUrl(product.image);
    if (img !== DEFAULT_PRODUCT_PLACEHOLDER) return img;
  }

  return DEFAULT_PRODUCT_PLACEHOLDER;
};

/**
 * Faz o parse de uma string de dimensões no formato "41.00x36.50x0.00", "41.00x36.50" ou "41.00"
 * Detecta automaticamente a unidade (mm ou cm)
 * Se for mm, converte para cm
 * Sempre exibe em cm
 * Valores zerados são filtrados
 * Se o decimal for .00, exibe apenas o número inteiro
 * @param dimensionString String com dimensões separadas por "x" (ex: "41.00x36.50x0.00" ou "41.00x36.50" ou "41.00")
 * @returns Array de objetos com label e valor formatado em cm (ex: [{label: "Altura", value: "41 cm"}])
 */
export const parseDimensions = (
  dimensionString: string,
): Array<{ label: string; value: string }> => {
  if (!dimensionString || typeof dimensionString !== "string") {
    return [];
  }

  // Detectar unidade (mm ou cm)
  const hasMillimeters = /mm/i.test(dimensionString);

  // Remover "mm" da string para fazer o parse
  const cleanString = dimensionString.replace(/mm/i, "");

  // Dividir por 'x' (case-insensitive) e remover espaços
  const parts = cleanString.split(/x/i).map((p) => p.trim());

  const labels = ["Altura", "Largura", "Profundidade"];
  const result: Array<{ label: string; value: string }> = [];

  parts.forEach((part, index) => {
    if (index < 3) {
      let value = parseFloat(part);

      // Converter de mm para cm se necessário
      if (hasMillimeters) {
        value = value / 10;
      }

      // Só incluir se não for NaN e não for zero
      if (!isNaN(value) && value !== 0) {
        // Formatar: se for .00, exibir apenas o inteiro
        const formatted =
          value % 1 === 0 ? Math.floor(value).toString() : value.toFixed(2);

        result.push({
          label: labels[index],
          value: `${formatted} cm`,
        });
      }
    }
  });

  return result;
};
