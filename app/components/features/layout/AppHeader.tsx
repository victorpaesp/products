import { Handbag, Search, SearchIcon, ShoppingBag } from "lucide-react";
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

export function AppHeader({
  selectedProducts = [],
  onOpenDrawer,
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
    sessionStorage.clear();
    submit(null, { method: "post", action: "/logout" });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("q", searchInput);
    newSearchParams.set("page", "1");
    newSearchParams.delete("variation_search");

    navigate(`/products?${newSearchParams.toString()}`);
  };

  return (
    <div className="mx-auto flex w-full flex-col items-center rounded-b-lg bg-[#363636] px-10">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center sm:basis-1/4">
          <Link to="/">
            <img
              src="/logo-santomimo-h-white.png"
              alt="logo"
              className="w-56 cursor-pointer rounded-md p-2"
            />
          </Link>
        </div>

        <div className="mx-auto flex min-w-0 flex-1 basis-full justify-center sm:basis-2/4">
          <form onSubmit={handleSubmit} className="w-full max-w-xl">
            <ButtonGroup className="w-full">
              <Input
                name="search"
                type="search"
                placeholder="Buscar produtos..."
                className="h-10 rounded-full p-4"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
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

        <div className="flex items-center justify-end gap-8 sm:basis-1/4">
          {selectedProducts.length > 0 && (
            <Button
              onClick={onOpenDrawer}
              className="relative hidden p-0 sm:flex"
              aria-label="Produtos Selecionados"
            >
              <span className="inline">
                <ShoppingBag className="size-7 text-white" />
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
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <div className="w-full px-4 pb-2 sm:hidden">
          <Button onClick={onOpenDrawer} className="relative w-full">
            <span className="inline">Produtos selecionados</span>
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {selectedProducts.length}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
