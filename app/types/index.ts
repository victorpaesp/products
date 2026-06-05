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

export type Product = {
  id: number;
  product_cod: string;
  provider: string;
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
