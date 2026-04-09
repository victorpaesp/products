import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import { ThemeProvider } from "~/components/theme-provider";
import { SearchBar } from "~/components/SearchBar";
import { SelectedProductsDrawer } from "~/components/SelectedProductsDrawer";
import { useEffect, useState } from "react";
import { useLocation } from "@remix-run/react";
import { Toaster } from "~/components/ui/sonner";
import {
  clearReloadMarkers,
  hasAlreadyReloadedOnce,
  isChunkAssetError,
  markReloadAsDone,
} from "~/components/ChunkErrorBoundary";

import type { LinksFunction } from "@remix-run/node";
import type { SelectedProduct } from "~/types";

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
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
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
  );
}

function forceHardReload(): void {
  if (typeof window === "undefined") {
    return;
  }

  (window.location as Location & { reload: (forced?: boolean) => void }).reload(
    true,
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const [isReloading, setIsReloading] = useState(false);
  const isAssetError = isChunkAssetError(error);

  useEffect(() => {
    if (!isAssetError) {
      return;
    }

    if (hasAlreadyReloadedOnce()) {
      return;
    }

    setIsReloading(true);
    markReloadAsDone();
    forceHardReload();
  }, [isAssetError]);

  const handleRetry = () => {
    clearReloadMarkers();
    setIsReloading(true);
    forceHardReload();
  };

  const handleGoHome = () => {
    clearReloadMarkers();

    if (typeof window !== "undefined") {
      window.location.assign("/");
    }
  };

  if (isAssetError && isReloading) {
    return (
      <html lang="en">
        <head>
          <Meta />
          <Links />
        </head>
        <body>
          <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-card-foreground shadow-sm">
              <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
              <p className="text-sm font-medium">Atualizando aplicação...</p>
            </div>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }

  if (isAssetError) {
    return (
      <html lang="en">
        <head>
          <Meta />
          <Links />
        </head>
        <body>
          <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full text-center max-w-lg rounded-xl border border-border bg-card p-6 text-card-foreground shadow">
              <h1 className="text-lg font-semibold">
                Ops! <br />
                Tivemos um problema ao carregar esta página.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                A conexão pode ter oscilado ou a página foi atualizada. Você
                pode tentar novamente ou retornar ao início.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 w-full">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex flex-1 h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Tentar novamente
                </button>
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="inline-flex flex-1 h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  Voltar para tela inicial
                </button>
              </div>
            </div>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }

  let title = "Application Error";
  let message = "Ocorreu um erro inesperado.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data || message;
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
