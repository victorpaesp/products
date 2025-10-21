import type { MetaFunction } from "@remix-run/node";
// import { Input } from "~/components/ui/input";
// import { Search } from "lucide-react";
import { useNavigate } from "@remix-run/react";
// import { useRef } from "react";
import { useEffect } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "Santo Mimo" }];
};

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/products");
  }, [navigate]);

  return null;
}

// export default function Index() {
//   const navigate = useNavigate();
//   const formRef = useRef<HTMLFormElement>(null);

//   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     const formData = new FormData(event.currentTarget);
//     const searchTerm = formData.get("search") as string;
//     navigate(`/products?q=${encodeURIComponent(searchTerm)}`);
//   };

//   return (
//     <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
//       <img src="/santo-mimo-logo.jpg" alt="logo" className="w-1/6" />
//       <div className="text-center w-full">
//         <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
//           Busca de produtos
//         </h1>
//         <Form ref={formRef} onSubmit={handleSubmit} className="w-full">
//           <div className="relative w-full max-w-4xl mx-auto">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//             <Input
//               name="search"
//               type="search"
//               placeholder="Buscar produtos..."
//               className="h-12 text-lg pl-10 w-full"
//             />
//           </div>
//         </Form>
//       </div>
//     </div>
//   );
// }
