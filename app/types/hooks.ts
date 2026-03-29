import type { Product } from "~/types/index";
import type { ExportToastStatus } from "~/types/components";

export type ExportToastState = {
  isVisible: boolean;
  status: ExportToastStatus;
  message?: string;
};

export type ExportProduct = Product & {
  images?: string[];
  stock?: number;
};
