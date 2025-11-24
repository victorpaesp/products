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
  success: boolean;
  data: Product[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    has_more_pages: boolean;
  };
  filters: {
    search?: string;
    sort?: Record<string, "asc" | "desc">;
  };
};

export type Product = {
  id: number;
  product_cod: string;
  provider: string;
  name: string;
  description: string;
  price: string;
  image: string;
  product_mention: string;
  product_weight: number;
  quantity_box: number;
  box_mention: string;
  gallery: string[];
  created_at: string;
  updated_at: string;
  variations: Variation[];
};

export type Variation = {
  id: number;
  product_id: number;
  product_cod: string;
  name: string;
  price: string;
  stock: number;
  images: string[];
};

export type Link = {
  url: string | null;
  label: string;
  active: boolean;
};
