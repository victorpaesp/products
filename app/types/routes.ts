import type { ApiResponse, Product, SelectedProduct } from "~/types/index";

export type LoginActionData = {
  error?: string;
};

export type ProductsLoaderData = {
  data: ApiResponse | null;
  error: string | null;
  token: string;
};

export type ProductDetailLoaderData = {
  token: string;
  productId: string;
  variationId?: string;
};

export type ProductDetailNavigationState = {
  from?: string;
  listingProduct?: Product;
};

export type ProductsOutletContextType = {
  selectedProducts: SelectedProduct[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<SelectedProduct[]>>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export type RegisterActionData = {
  error?: string;
};

export type ResetPasswordActionData = {
  ok?: boolean;
  error?: string;
};

export type SettingsActionData = {
  ok?: boolean;
  error?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
    phone?: string;
  };
};

export type ApiForgotPasswordActionData = {
  ok?: boolean;
  error?: string;
};

export type ApiProductDescriptionActionData = {
  ok?: boolean;
  error?: string;
  description_override?: string | null;
};
