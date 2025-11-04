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
  current_page: number;
  data: Product[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Link[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
};

export type Product = {
  ProductCod: string;
  Provider: string;
  Name: string;
  Description: string;
  Price: string;
  Image: string;
  Gallery: string[];
  Product_Mention: string | null;
  Product_Weight: string | null;
  Quantity_Box: string | null;
  Box_Mention: string | null;
  variation: Variation[];
};

export type Variation = {
  ProductCod: string;
  Name: string;
  Price: string;
  Stock: number;
  Image: string;
};

export type Link = {
  url: string | null;
  label: string;
  active: boolean;
};
