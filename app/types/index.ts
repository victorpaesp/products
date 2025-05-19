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