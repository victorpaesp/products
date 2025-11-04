import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  id?: string;
};

export function toast(message: string, options?: ToastOptions) {
  return sonnerToast(message, options);
}

toast.success = (message: string, options?: ToastOptions) =>
  sonnerToast.success(message, options);
toast.error = (message: string, options?: ToastOptions) =>
  sonnerToast.error(message, options);
toast.warning = (message: string, options?: ToastOptions) =>
  sonnerToast.warning(message, options);
toast.info = (message: string, options?: ToastOptions) =>
  sonnerToast(message, options);

export default toast;
