import {
  SearchIcon,
  ShieldCheck,
  ShoppingBag,
  User,
  XIcon,
} from "lucide-react";
import {
  useNavigate,
  useRouteLoaderData,
  useSearchParams,
  Link,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { loader as rootLoader } from "~/root";
import type { AppHeaderProps } from "~/types/components";
import { ADMIN_PANEL_ENTRY_POINTS_ENABLED } from "~/lib/admin-feature";

export function AppHeader({
  selectedProducts = [],
  onOpenDrawer,
  onClearSelectedProducts,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const user = rootData?.user;

  const getUserInitials = (name?: string): string => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };
  const [searchInput, setSearchInput] = useState(searchTerm);

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  const handleLogout = () => {
    onClearSelectedProducts?.();
    sessionStorage.clear();
    submit(null, { method: "post", action: "/logout" });
  };

  const navigateWithSearch = (term: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    const trimmed = term.trim();

    if (trimmed) {
      newSearchParams.set("q", trimmed);
    } else {
      newSearchParams.delete("q");
    }

    newSearchParams.set("page", "1");
    newSearchParams.delete("color");
    navigate(`/products?${newSearchParams.toString()}`);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateWithSearch(searchInput);
  };

  const handleClear = () => {
    setSearchInput("");
    navigateWithSearch("");
  };

  const searchField = (inputClassName: string) => (
    <div className="relative min-w-0 flex-1">
      <Input
        type="search"
        placeholder="Buscar produtos..."
        className={inputClassName}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      {searchInput.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-2 size-7 -translate-y-1/2 rounded-full text-neutral-500 hover:text-neutral-700"
          aria-label="Limpar busca"
          onClick={handleClear}
        >
          <XIcon className="size-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto flex w-full flex-col items-center rounded-b-lg bg-[#363636] p-2 md:px-10 md:py-0">
      <div className="flex w-full items-center justify-between gap-3 p-2">
        <div className="flex items-center sm:basis-1/4">
          <Link to="/">
            <img
              src="/logo-new-white.png"
              alt="logo"
              className="w-46 cursor-pointer sm:hidden md:p-2"
            />
            <img
              src="/logo-new-white.png"
              alt="logo"
              className="hidden w-46 cursor-pointer sm:block md:p-2"
            />
          </Link>
        </div>

        <div className="mx-auto hidden min-w-0 flex-1 basis-full justify-center sm:flex">
          <form onSubmit={handleSubmit} className="w-full max-w-xl">
            <ButtonGroup className="w-full">
              {searchField("h-10 rounded-l-full rounded-r-none p-4 pr-10")}
              <Button
                variant="outline"
                className="rounded-full p-4!"
                aria-label="Search"
                size="lg"
              >
                <SearchIcon className="size-4.5 text-neutral-500" />
              </Button>
            </ButtonGroup>
          </form>
        </div>

        <div className="flex items-center justify-end gap-4 sm:basis-1/4 sm:gap-8">
          {selectedProducts.length > 0 && (
            <Button
              onClick={onOpenDrawer}
              className="relative p-0"
              aria-label="Produtos Selecionados"
            >
              <span className="inline">
                <ShoppingBag className="size-7 text-white" strokeWidth={1.5} />
              </span>
              <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {selectedProducts.length}
              </span>
            </Button>
          )}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
              <div className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-lg font-medium text-neutral-700">
                {getUserInitials(user?.name)}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {user && (
                <>
                  <DropdownMenuItem disabled>
                    <div className="flex flex-col">
                      <span className="font-medium text-neutral-800">
                        {user.name}
                      </span>
                      <span className="text-xs text-neutral-600">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <User />
                Configurações
              </DropdownMenuItem>
              {user?.role === "admin" && ADMIN_PANEL_ENTRY_POINTS_ENABLED ? (
                <DropdownMenuItem asChild>
                  <Link to="/admin/products">
                    <ShieldCheck />
                    Painel de administração
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="w-full p-2 sm:hidden">
        <form onSubmit={handleSubmit} className="w-full">
          <ButtonGroup className="w-full">
            {searchField("h-10 w-full rounded-l-full rounded-r-none p-4 pr-10")}
            <Button
              variant="outline"
              className="rounded-full p-4!"
              aria-label="Search"
              size="lg"
            >
              <SearchIcon className="size-4.5 text-neutral-500" />
            </Button>
          </ButtonGroup>
        </form>
      </div>
    </div>
  );
}
