import type { ColumnDef } from "@tanstack/react-table";
import type { UseFormReturn } from "react-hook-form";
import type {
  AuthUser,
  FormValues,
  Product,
  SelectedProduct,
  Variation,
} from "~/types/index";

export type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumn?: string;
  filterPlaceholder?: string;
  globalFilterFn?: (row: TData, filterValue: string) => boolean;
};

export type UsersTableUser = {
  id: string | number;
  name: string;
  email: string;
  cpf_cnpj: string;
  phone: string;
  preferred_contact_method: string;
  role: "admin" | "user";
};

export type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UsersTableUser | null;
  onSuccess: () => void;
};

export type ExportProposalData = {
  seller: string;
  company: string;
  contact: string;
};

export type ExportProposalModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExportProposalData) => void;
};

export type ExportToastStatus = "processing" | "success" | "error";

export type ExportToastProps = {
  isVisible: boolean;
  onClose: () => void;
  status: ExportToastStatus;
  message?: string;
};

export type ForgotPasswordFormValues = {
  email: string;
};

export type ForgotPasswordFormProps = {
  form: UseFormReturn<ForgotPasswordFormValues>;
  onBackToLogin: () => void;
};

export type PasswordChecklistProps = {
  password: string;
  confirmPassword?: string;
  onValidChange?: (valid: boolean) => void;
};

export type ProductCardProps = {
  product: Product;
  onSelect?: (product: Product, variation: Variation) => void;
  selectedVariations?: string[];
  onProductUpdate?: (updatedProduct: Product) => void;
};

export type ProductsPaginationProps = {
  page: number;
  perPage: number;
  data: { total: number } | null;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
  className?: string;
};

export type ProfileFormProps = {
  currentUser: AuthUser & { phone?: string };
  isAdmin: boolean;
};

export type RegisterFormProps = {
  onSubmit: (values: FormValues) => void;
  isPasswordValid: boolean;
  setIsPasswordValid: (valid: boolean) => void;
  form: UseFormReturn<FormValues>;
};

export type AppHeaderProps = {
  selectedProducts?: SelectedProduct[];
  onOpenDrawer?: () => void;
};

export type SearchBarProps = AppHeaderProps;

export type ProductsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: SelectedProduct[];
  onRemoveProduct: (product_cod: string, variation_cod: string) => void;
  onClearProducts?: () => void;
};

export type SelectedProductsDrawerProps = ProductsDrawerProps;

export type ProductModalProps = {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate?: (updatedProduct: Product) => void;
};

export type ImageCarouselProps = {
  images: string[];
  productName: string;
  mainImage?: string;
};

export type DescriptionActionData = {
  ok?: boolean;
  error?: string;
  description_override?: string | null;
};

export type ProductDetailsProps = {
  product: Product;
  onProductUpdate?: (updatedProduct: Product) => void;
};

export type EmptyStateProps = {
  message?: string;
};

export type ErrorStateProps = {
  message?: string;
};

export type LoadingStateProps = {
  compact?: boolean;
};

export type QuantityInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
};
