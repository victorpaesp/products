import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "@remix-run/react";
import { ThemeProvider } from "~/lib/theme-provider";
import { AppHeader } from "~/components/features/layout/AppHeader";
import { ProductsDrawer } from "~/components/features/products/ProductsDrawer";
import { useEffect, useState } from "react";
import { useLocation } from "@remix-run/react";
import { Toaster } from "~/components/ui/sonner";

import {
  data,
  type LoaderFunctionArgs,
  type LinksFunction,
} from "@remix-run/node";
import type { SelectedProduct } from "~/types";
import { getSessionUser } from "~/lib/auth.server";
import { QueryProvider } from "~/components/providers/QueryProvider";

import "./tailwind.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getSessionUser(request);
  return data({ user });
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50">
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const [showGlobalProgress, setShowGlobalProgress] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  const hideHeaderRoutes = ["/login", "/register", "/reset-password"];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  useEffect(() => {
    if (!isNavigating) {
      setShowGlobalProgress(false);
      return;
    }

    const showDelay = setTimeout(() => {
      setShowGlobalProgress(true);
    }, 120);

    return () => {
      clearTimeout(showDelay);
    };
  }, [isNavigating]);

  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        {showGlobalProgress && (
          <div className="fixed top-0 left-0 right-0 z-[70] route-progress-track">
            <div className="h-1 w-full bg-gray-200/70 overflow-hidden">
              <div className="route-progress-indicator h-full" />
            </div>
          </div>
        )}
        {shouldShowHeader && (
          <AppHeader
            selectedProducts={selectedProducts}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}
        <Outlet
          context={{
            selectedProducts,
            setSelectedProducts,
            isDrawerOpen,
            setIsDrawerOpen,
          }}
        />
        <ProductsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          selectedProducts={selectedProducts}
          onRemoveProduct={(product_cod: string, variation_cod: string) => {
            setSelectedProducts((prev) =>
              prev.filter((item) => {
                if (
                  item.product.variations.length === 1 &&
                  item.product.product_cod === product_cod
                ) {
                  return false;
                }
                return !(
                  item.product.product_cod === product_cod &&
                  item.variation.product_cod === variation_cod
                );
              }),
            );
          }}
          onClearProducts={() => {
            setSelectedProducts([]);
            setIsDrawerOpen(false);
          }}
        />
      </ThemeProvider>
    </QueryProvider>
  );
}
