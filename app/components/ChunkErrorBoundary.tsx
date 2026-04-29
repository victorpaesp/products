import { Component, type ErrorInfo, type ReactNode } from "react";

type ChunkErrorBoundaryProps = {
  children: ReactNode;
};

type ChunkErrorBoundaryState = {
  hasError: boolean;
  isAssetError: boolean;
  isReloading: boolean;
};

const RELOAD_STORAGE_KEY = "chunk_error_boundary_last_reload_at";
const RELOAD_QUERY_PARAM = "chunkReloadAt";
const RELOAD_WINDOW_MS = 15 * 60 * 1000;
const ASSET_ERROR_PATTERNS = [
  "failed to fetch",
  "chunkloaderror",
  "loading chunk failed",
  "failed to fetch dynamically imported module",
];

const isBrowser = typeof window !== "undefined";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name || "";
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

export function isChunkAssetError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return ASSET_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function hasAlreadyReloadedOnce(): boolean {
  if (!isBrowser) {
    return false;
  }

  try {
    const storedValue = window.sessionStorage.getItem(RELOAD_STORAGE_KEY);
    const timestamp = Number(storedValue);

    const url = new URL(window.location.href);
    if (url.searchParams.has(RELOAD_QUERY_PARAM)) {
      url.searchParams.delete(RELOAD_QUERY_PARAM);
      window.history.replaceState({}, "", url.toString());
    }

    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return false;
    }

    const isInsideReloadWindow = Date.now() - timestamp < RELOAD_WINDOW_MS;
    if (!isInsideReloadWindow) {
      clearReloadMarkers();
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function markReloadAsDone(): void {
  if (!isBrowser) {
    return;
  }

  try {
    const now = String(Date.now());
    window.sessionStorage.setItem(RELOAD_STORAGE_KEY, now);
  } catch {}
}

export function clearReloadMarkers(): void {
  if (!isBrowser) {
    return;
  }

  try {
    window.sessionStorage.removeItem(RELOAD_STORAGE_KEY);

    const url = new URL(window.location.href);
    if (url.searchParams.has(RELOAD_QUERY_PARAM)) {
      url.searchParams.delete(RELOAD_QUERY_PARAM);
      window.history.replaceState({}, "", url.toString());
    }
  } catch {}
}

function forceReload(): void {
  if (!isBrowser) {
    return;
  }

  (window.location as Location & { reload: (forced?: boolean) => void }).reload(
    true,
  );
}

export class ChunkErrorBoundary extends Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  state: ChunkErrorBoundaryState = {
    hasError: false,
    isAssetError: false,
    isReloading: false,
  };

  static getDerivedStateFromError(error: unknown): ChunkErrorBoundaryState {
    return {
      hasError: true,
      isAssetError: isChunkAssetError(error),
      isReloading: false,
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    console.error("ChunkErrorBoundary captured an error", error, errorInfo);

    if (!isChunkAssetError(error)) {
      return;
    }

    if (hasAlreadyReloadedOnce()) {
      this.setState({ isReloading: false });
      return;
    }

    this.setState({ isReloading: true }, () => {
      markReloadAsDone();
      forceReload();
    });
  }

  handleRetry = (): void => {
    clearReloadMarkers();
    this.setState({ isReloading: true }, () => {
      forceReload();
    });
  };

  handleGoHome = (): void => {
    clearReloadMarkers();

    if (typeof window !== "undefined") {
      window.location.assign("/");
    }
  };

  render(): ReactNode {
    const { hasError, isAssetError, isReloading } = this.state;

    if (!hasError) {
      return this.props.children;
    }

    if (isAssetError && isReloading) {
      return (
        <div className="bg-background flex min-h-screen items-center justify-center px-4">
          <div className="border-border bg-card text-card-foreground flex items-center gap-3 rounded-lg border px-5 py-4 shadow-xs">
            <span className="bg-primary h-3 w-3 animate-pulse rounded-full" />
            <p className="text-sm font-medium">Atualizando aplicação...</p>
          </div>
        </div>
      );
    }

    if (isAssetError) {
      return (
        <div className="bg-background flex min-h-screen items-center justify-center px-4">
          <div className="border-border bg-card text-card-foreground w-full max-w-lg rounded-xl border p-6 text-center shadow">
            <h1 className="text-lg font-semibold">
              Ops! <br />
              Tivemos um problema ao carregar esta página.
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              A conexão pode ter oscilado ou a página foi atualizada. Você pode
              tentar novamente ou retornar ao início.
            </p>
            <div className="mt-4 flex w-full flex-wrap gap-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="bg-primary text-primary-foreground inline-flex h-10 flex-1 items-center justify-center rounded-md px-4 text-sm font-medium transition hover:opacity-90"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="border-border bg-background text-foreground hover:bg-muted inline-flex h-10 flex-1 items-center justify-center rounded-md border px-4 text-sm font-medium transition"
              >
                Voltar para tela inicial
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="border-border bg-card text-card-foreground w-full max-w-md rounded-xl border p-6 shadow">
          <h1 className="text-lg font-semibold">Ocorreu um erro inesperado</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Recarregue a página para tentar novamente.
          </p>
        </div>
      </div>
    );
  }
}
