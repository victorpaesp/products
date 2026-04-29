import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  useRouteError,
} from "@remix-run/react";
import { ThemeProvider } from "~/lib/theme-provider";
import { AppHeader } from "~/components/features/layout/AppHeader";
import { AppFooter } from "~/components/features/layout/AppFooter";
import { ProductsDrawer } from "~/components/features/products/ProductsDrawer";
import { useEffect, useState } from "react";
import { useLocation } from "@remix-run/react";
import { Toaster } from "~/components/ui/sonner";
import {
  clearReloadMarkers,
  hasAlreadyReloadedOnce,
  isChunkAssetError,
  markReloadAsDone,
} from "~/components/ChunkErrorBoundary";

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
      <body className="flex min-h-screen flex-col">
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
          <div className="route-progress-track fixed top-0 right-0 left-0 z-70">
            <div className="h-1 w-full overflow-hidden bg-neutral-200/70">
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
        <div className="flex-1">
          <Outlet
            context={{
              selectedProducts,
              setSelectedProducts,
              isDrawerOpen,
              setIsDrawerOpen,
            }}
          />
        </div>
        {shouldShowHeader && <AppFooter />}
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
          <div className="bg-background flex min-h-screen items-center justify-center px-4">
            <div className="border-border bg-card text-card-foreground flex items-center gap-3 rounded-lg border px-5 py-4 shadow-xs">
              <span className="bg-primary h-3 w-3 animate-pulse rounded-full" />
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
          <div className="bg-background flex min-h-screen items-center justify-center px-4">
            <div className="border-border bg-card text-card-foreground w-full max-w-lg rounded-xl border p-6 text-center shadow">
              <h1 className="text-lg font-semibold">
                Ops! <br />
                Tivemos um problema ao carregar esta página.
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                A conexão pode ter oscilado ou a página foi atualizada. Você
                pode tentar novamente ou retornar ao início.
              </p>
              <div className="mt-4 flex w-full flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="bg-primary text-primary-foreground inline-flex h-10 flex-1 items-center justify-center rounded-md px-4 text-sm font-medium transition hover:opacity-90"
                >
                  Tentar novamente
                </button>
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="border-border bg-background text-foreground hover:bg-muted inline-flex h-10 flex-1 items-center justify-center rounded-md border px-4 text-sm font-medium transition"
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
        <div className="bg-background flex min-h-screen items-center justify-center px-4">
          <div className="border-border bg-card text-card-foreground w-full max-w-md rounded-xl border p-6 shadow">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-muted-foreground mt-2 text-sm">{message}</p>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
