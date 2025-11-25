import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import { ThemeProvider } from "~/components/theme-provider";
import { SearchBar } from "~/components/SearchBar";
import { SelectedProductsDrawer } from "~/components/SelectedProductsDrawer";
import { useState } from "react";
import { useLocation } from "@remix-run/react";
import type { Product } from "~/types";
import { Toaster } from "~/components/ui/sonner";

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
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
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export default function App() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  const hideSearchBarRoutes = ["/login", "/register", "/reset-password"];
  const shouldShowSearchBar = !hideSearchBarRoutes.includes(location.pathname);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      {shouldShowSearchBar && (
        <SearchBar
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
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
      <SelectedProductsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedProducts={selectedProducts}
        onRemoveProduct={(product_cod: string) =>
          setSelectedProducts((prev) =>
            prev.filter((p) => p.product_cod !== product_cod)
          )
        }
        onClearProducts={() => {
          setSelectedProducts([]);
          setIsDrawerOpen(false);
        }}
      />
    </ThemeProvider>
  );
}
