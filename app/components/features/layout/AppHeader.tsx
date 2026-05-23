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
    <div className="mx-auto flex w-full flex-col items-center rounded-b-lg bg-[#363636] p-2 md:px-10 md:py-0">
      <div className="flex w-full items-center justify-between gap-3 p-2 pl-0">
        <div className="flex items-center sm:basis-1/4">
          <Link to="/">
            <img
              src="/logo-santomimo-h2-white.png"
              alt="logo"
              className="w-52 cursor-pointer rounded-md sm:hidden md:p-2"
            />
            <img
              src="/logo-santomimo-h-white.png"
              alt="logo"
              className="hidden w-56 cursor-pointer rounded-md sm:block md:p-2"
            />
          </Link>
        </div>

        <div className="mx-auto hidden min-w-0 flex-1 basis-full justify-center sm:flex">
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
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="w-full p-2 sm:hidden">
        <form onSubmit={handleSubmit} className="w-full">
          <ButtonGroup className="w-full">
            <Input
              name="search"
              type="search"
              placeholder="Buscar produtos..."
              className="h-10 w-full rounded-full p-4"
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
    </div>
  );
}
