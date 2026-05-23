import {
  data,
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import {
  useLoaderData,
  useLocation,
  useNavigate,
  Link,
} from "@remix-run/react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireAuth } from "~/lib/auth.server";
import { fetchProductsForRequest } from "~/lib/products.server";
import { BackendApiError } from "~/lib/backend.server";
import { getProductImage } from "~/lib/utils";
import { ImageCarousel } from "~/components/features/products/modal/ImageCarousel";
import { ProductDetails } from "~/components/features/products/modal/ProductDetails";
import { Button } from "~/components/ui/button";
import type { Product } from "~/types";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireAuth(request);
  const productCod = params.product_cod;

  if (!productCod) {
    throw redirect("/products");
  }

  try {
    const apiParams = new URLSearchParams({
      search: productCod,
      per_page: "20",
    });
    const result = await fetchProductsForRequest({ token, params: apiParams });

    const product = result.data.find((p) => p.product_cod === productCod);

    if (!product) {
      throw data({ error: "Produto não encontrado." }, { status: 404 });
    }

    return data({ product });
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      throw redirect("/login");
    }
    throw error;
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const name = data?.product?.name ?? "Detalhes do Produto";
  return [{ title: `${name} — Santo Mimo` }];
};

export default function ProductDetailPage() {
  const loaderData = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateProduct = (location.state as { product?: Product } | null)
    ?.product;
  const [product, setProduct] = useState<Product>(
    stateProduct ?? loaderData.product,
  );

  const from = (location.state as { from?: string } | null)?.from;

  const handleBack = () => {
    if (from) {
      navigate(from);
    } else {
      navigate("/products");
    }
  };

  const allImages = [getProductImage(product), ...(product.gallery || [])];

  return (
    <section className="sm-container pb-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-sm text-neutral-500"
        >
          <Link
            to="/products"
            className="shrink-0 transition-colors hover:text-neutral-900"
          >
            Produtos
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <span
            className="min-w-0 truncate font-medium text-neutral-900"
            title={product.name}
          >
            {product.name}
          </span>
        </nav>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <ImageCarousel images={allImages} productName={product.name} />
        <ProductDetails product={product} onProductUpdate={setProduct} />
      </div>
    </section>
  );
}
