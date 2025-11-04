import { Search, UserRound } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "@remix-run/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Product } from "~/types";
import { useAuth } from "~/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface SearchBarProps {
  selectedProducts?: Product[];
  setSelectedProducts?: (products: Product[]) => void;
  onOpenDrawer?: () => void;
}

export function SearchBar({
  selectedProducts = [],
  onOpenDrawer,
}: SearchBarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const { user, logout } = useAuth();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("q", search);
    newSearchParams.set("page", "1");

    navigate(`/products?${newSearchParams.toString()}`);
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-800 shadow-md z-10 flex items-center flex-col">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center sm:basis-1/4">
          <Link to="/">
            <img
              src="/santo-mimo-logo.jpg"
              alt="logo"
              className="w-[50px] cursor-pointer"
            />
          </Link>
        </div>

        <div className="flex-1 min-w-0 sm:basis-2/4 basis-full">
          <form onSubmit={handleSubmit} className="max-w-2xl w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                name="search"
                type="search"
                placeholder="Buscar produtos..."
                defaultValue={searchTerm}
                className="pl-10"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3 sm:basis-1/4 justify-end">
          {selectedProducts.length > 0 && (
            <Button onClick={onOpenDrawer} className="relative hidden sm:flex">
              <span className="inline">Produtos selecionados</span>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {selectedProducts.length}
              </span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="border border-gray-100 rounded-full p-1">
                <UserRound
                  size={24}
                  strokeWidth={1.5}
                  className=" text-white"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {user && (
                <>
                  <DropdownMenuItem disabled>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-600">
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
              <DropdownMenuItem onClick={logout}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <div className="w-full px-4 pb-2 sm:hidden">
          <Button onClick={onOpenDrawer} className="relative w-full">
            <span className="inline">Produtos selecionados</span>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {selectedProducts.length}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
