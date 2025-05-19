import { useNavigate, useSearchParams } from "@remix-run/react";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { api } from "~/lib/axios";

interface SearchBarProps {
  onSearch: (data: any) => void;
  onLoading: (loading: boolean) => void;
}

export function SearchBar({ onSearch, onLoading }: SearchBarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "12";

    onLoading(true);
    api
      .get("/dados", {
        params: {
          productName: search,
          page,
          per_page: perPage,
        },
      })
      .then((response) => {
        onSearch(response.data);
        navigate(`/products?q=${encodeURIComponent(search)}`);
      })
      .finally(() => onLoading(false));
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-800 shadow-md z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <img src="/logo.jpeg" alt="logo" className="w-[50px]" />
        <form onSubmit={handleSubmit} className="max-w-2xl w-full mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              name="search"
              type="search"
              placeholder="Buscar produtos..."
              defaultValue={searchTerm}
              className="h-12 text-lg pl-10 w-full bg-black text-white placeholder:text-gray-400"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
