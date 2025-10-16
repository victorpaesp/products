import { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";
import { Form, useNavigate } from "@remix-run/react";
import { useRef } from "react";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { requireAuth } from "~/lib/auth.server";

export const meta: MetaFunction = () => {
  return [{ title: "Santo Mimo" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  return null;
}

export default function Index() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchTerm = formData.get("search") as string;
    navigate(`/products?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 bg-[#f7f7f7]">
        <img src="/logo.jpeg" alt="logo" className="max-w-72 rounded-lg" />
        <div className="text-center w-full">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
            Inicie sua busca pelos produtos
          </h1>
          <Form ref={formRef} onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full max-w-4xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                name="search"
                type="search"
                placeholder="Buscar produtos..."
                className="h-12 text-lg pl-10 w-full"
              />
            </div>
          </Form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
