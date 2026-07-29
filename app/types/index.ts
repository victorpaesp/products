export type FormValues = {
  email: string;
  password: string;
  repeatPassword?: string;
  name?: string;
  cpf_cnpj?: string;
  phone?: string;
  preferred_contact_method?: "email" | "phone" | "whatsapp";
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  cpf_cnpj?: string;
  phone?: string;
  preferred_contact_method: "email" | "phone" | "whatsapp";
  created_at: string;
  updated_at: string;
};

export type AuthUser = Pick<User, "id" | "name" | "email" | "role">;

export type LoginResponse = {
  token: string;
  token_type: string;
  expires_in: number;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  cpf_cnpj?: string;
  phone?: string;
  preferred_contact_method: "email" | "phone" | "whatsapp";
  role?: "admin" | "user";
};

export type ApiResponse = {
  success?: boolean;
  data: Product[];
  current_page: number;
  first_page_url: string | null;
  from: number;
  last_page: number;
  last_page_url: string | null;
  links: Link[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
  filters?: {
    search?: string;
    sort?: Record<string, "asc" | "desc">;
  };
};

export type ProductColor = {
  id: number;
  name: string;
  slug?: string;
};

export type ColorsApiResponse = {
  data: ProductColor[];
};

export type ProductSupplier = {
  id: number;
  name: string;
  alias: string;
  image: string | null;
};

export type SuppliersApiResponse = {
  data: ProductSupplier[];
};

export type ProductCategory = {
  id?: number;
  name: string;
  slug: string;
  children: ProductCategory[];
};

export type CategoriesApiResponse = {
  data: ProductCategory[];
};

export type CategoryKeyword = {
  id: number;
  category_id: number;
  keyword: string;
  weight: number;
  created_at: string;
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  description: string | null;
  active: boolean;
  keywords: CategoryKeyword[];
  children: AdminCategory[];
  created_at?: string;
  updated_at?: string;
};

export type AdminCategoriesApiResponse = {
  success?: boolean;
  data: AdminCategory[];
};

export type CategoryKeywordPayload = {
  keyword: string;
  weight: number;
};

export type CategoryUpsertPayload = {
  name: string;
  parent_id: number | null;
  description: string | null;
  active: boolean;
  keywords?: CategoryKeywordPayload[];
};

export type CategoryReviewStatus = "pending" | "approved" | "rejected";

export type CategoryReview = {
  id: number;
  score: number;
  status: CategoryReviewStatus;
  product: {
    id: number;
    name: string;
    provider: string;
  };
  suggested_category: {
    id: number;
    name: string;
    parent: string | null;
  } | null;
  created_at: string;
};

export type CategoryReviewsPagination = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

export type CategoryReviewsResult = {
  reviews: CategoryReview[];
  pagination: CategoryReviewsPagination;
};

export type Product = {
  id: number;
  product_cod: string;
  supplier: ProductSupplier;
  name: string;
  description: string;
  description_original?: string;
  description_override?: string | null;
  price: string;
  image: string;
  product_mention: string;
  product_weight: string;
  box_weight?: string;
  quantity_box: number;
  box_mention: string;
  gallery: string[];
  created_at: string;
  updated_at: string;
  variations: Variation[];
  selected_variation?: Variation;
  fiscal_classification_type: string;
  fiscal_classification_code: string | number;
};

export type VariationColorEntry = {
  color: ProductColor;
};

export type Variation = {
  id: number;
  product_id: number;
  product_cod: string;
  name: string;
  price: string;
  stock: number;
  images: string[];
  colors?: VariationColorEntry[];
};

export type SelectedProduct = {
  product: Product;
  variation: Variation;
  colorFiltered?: boolean;
};

export type Link = {
  url: string | null;
  label: string;
  active: boolean;
};
