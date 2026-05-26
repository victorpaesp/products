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

export const hasNonZeroNumber = (value?: string | null): boolean => {
  if (!value || typeof value !== "string") return false;
  return /[1-9]/.test(value);
};

export const getVariationDifference = (
  productName: string,
  variationName: string,
): string => {
  if (!productName || !variationName) return variationName;

  if (productName === variationName) return variationName;

  const productLower = productName.toLowerCase();
  const variationLower = variationName.toLowerCase();

  if (variationLower === productLower) return variationName;

  const productIndex = variationLower.indexOf(productLower);
  if (productIndex !== -1) {
    const difference = variationName.substring(
      productIndex + productName.length,
    );
    const trimmedDifference = difference.trim();

    if (!trimmedDifference) return variationName;

    return (
      trimmedDifference.charAt(0).toUpperCase() + trimmedDifference.slice(1)
    );
  }

  const productWords = productName.toLowerCase().split(/\s+/);
  const variationWords = variationName.toLowerCase().split(/\s+/);

  const difference = variationWords
    .filter((word) => !productWords.includes(word))
    .join(" ");

  const result = difference || variationName;

  return result.charAt(0).toUpperCase() + result.slice(1);
};

const parseWeightValue = (value: string): number | null => {
  const cleaned = value.trim().replace(/\s/g, "");
  if (!cleaned) return null;

  if (!/^[\d.,]+$/.test(cleaned)) return null;

  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, "").replace(",", "."));
  }

  if (/^\d{1,3}(,\d{3})*\.\d+$/.test(cleaned)) {
    return Number(cleaned.replace(/,/g, ""));
  }

  if (cleaned.includes(",") && cleaned.includes(".")) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    if (lastDot > lastComma) {
      return Number(cleaned.replace(/,/g, ""));
    }

    return Number(cleaned.replace(/\./g, "").replace(/,/g, "."));
  }

  if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length === 3) {
      return Number(cleaned.replace(/,/g, ""));
    }
    return Number(cleaned.replace(/,/g, "."));
  }

  return Number(cleaned);
};

export const formatWeight = (value?: string | null): string | null => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const isKg = /kg(?:s)?\b/.test(lower);
  const isMg = /mg(?:s)?\b/.test(lower);
  const numericPart = lower
    .replace(/kg(?:s)?\b/, "")
    .replace(/mg(?:s)?\b/, "")
    .replace(/g(?:s)?\b/, "")
    .trim();

  const weight = parseWeightValue(numericPart);
  if (weight === null || weight === 0) return null;

  let grams = weight;
  if (isKg) grams *= 1000;
  if (isMg) grams /= 1000;

  if (grams === 0) return null;

  const formatted =
    grams % 1 === 0
      ? String(Math.floor(grams))
      : String(Number(grams.toFixed(3))).replace(
          /\.0+$|(?<=\.[0-9]*[1-9])0+$/,
          "",
        );

  return `${formatted}g`;
};

const formatAsKilograms = (value: number): string => {
  if (value % 1 === 0) {
    return `${Math.floor(value)}kg`;
  }

  return `${String(Number(value.toFixed(3))).replace(/\.0+$|(?<=\.[0-9]*[1-9])0+$/, "")}kg`;
};

export const formatBoxWeight = (value?: string | null): string | null => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const isKg = /kg(?:s)?\b/.test(lower);
  const isMg = /mg(?:s)?\b/.test(lower);
  const isG = /g(?:s)?\b/.test(lower) && !isKg && !isMg;

  let numericPart = lower;
  if (isKg) {
    numericPart = numericPart.replace(/kg(?:s)?\b/, "");
  } else if (isMg) {
    numericPart = numericPart.replace(/mg(?:s)?\b/, "");
  } else {
    numericPart = numericPart.replace(/g(?:s)?\b/, "");
  }

  numericPart = numericPart.trim();
  const weight = parseWeightValue(numericPart);
  if (weight === null || weight === 0) return null;

  let kilograms = weight;
  if (isKg) {
    kilograms = weight;
  } else if (isMg) {
    kilograms = weight / 1_000_000;
  } else {
    kilograms = weight / 1000;
  }

  if (kilograms === 0) return null;
  return formatAsKilograms(kilograms);
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

export const providerLogoMap: Record<string, string> = {
  AsianImport: "/asiaimport-logo.png",
  MinhaXBZ: "/xbz-logo.png",
  SpotGifts: "/spotgifts-logo.png",
};

export const providerDisplayNameMap: Record<string, string> = {
  AsianImport: "Asia Import",
  MinhaXBZ: "XBZ Brindes",
  SpotGifts: "SPOT",
};

export const getProviderLogoPath = (provider?: string): string => {
  if (!provider || typeof provider !== "string") {
    return "/logo-santomimo.png";
  }

  return providerLogoMap[provider] ?? "/logo-santomimo.png";
};

export const getProviderDisplayName = (provider?: string): string => {
  if (!provider || typeof provider !== "string") {
    return "";
  }

  return providerDisplayNameMap[provider] ?? provider;
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
