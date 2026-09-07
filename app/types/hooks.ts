import type { Product } from "~/types/index";

export type ExportProduct = Product & {
  images?: string[];
  stock?: number;
};
