import {
  data,
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData, useLocation, useNavigate, Link } from "@remix-run/react";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireAuth } from "~/lib/auth.server";
import { getProductCarouselImages } from "~/lib/utils";
import { ImageCarousel } from "~/components/features/products/modal/ImageCarousel";
import { ProductDetails } from "~/components/features/products/modal/ProductDetails";
import { Button } from "~/components/ui/button";
import { useProductQuery } from "~/hooks/useProduct";
import { ErrorState } from "~/components/shared/ErrorState";
import { LoadingState } from "~/components/shared/LoadingState";
import type { Product } from "~/types";
import {
  findProductInListCache,
  mergeProductSpecsFromListing,
} from "~/lib/products-query";
import type {
  ProductDetailLoaderData,
  ProductDetailNavigationState,
} from "~/types/routes";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireAuth(request);
  const productId = params.productId;

  if (!productId) {
    throw redirect("/products");
  }

  const url = new URL(request.url);
  const variationId = url.searchParams.get("variation_id") ?? undefined;

  return data<ProductDetailLoaderData>({
    token,
    productId,
    variationId,
  });
}

export const meta: MetaFunction = () => {
  return [{ title: "Detalhes do Produto — Santo Mimo" }];
};

export default function ProductDetailPage() {
  const { token, productId, variationId } =
    useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const navState = location.state as ProductDetailNavigationState | null;

  const { data: product, isLoading, isError, error } = useProductQuery({
    productId,
    token,
    variationId,
  });

  const listingProduct =
    navState?.listingProduct ?? findProductInListCache(queryClient, productId);

  const [updatedProduct, setUpdatedProduct] = useState<Product | null>(null);

  const displayProduct = useMemo(() => {
    const baseProduct = updatedProduct ?? product;
    if (!baseProduct) return null;
    return mergeProductSpecsFromListing(baseProduct, listingProduct);
  }, [updatedProduct, product, listingProduct]);

  const from = navState?.from;

  const handleBack = () => {
    if (from) {
      navigate(from);
    } else {
      navigate("/products");
    }
  };

  if (isLoading || !displayProduct) {
    return (
      <section className="sm-container pb-12">
        <LoadingState />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="sm-container pb-12">
        <div className="flex h-64 items-center justify-center">
          <ErrorState
            message={error.message || "Erro ao carregar o produto."}
          />
        </div>
      </section>
    );
  }

  const allImages = getProductCarouselImages(displayProduct);

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
            title={displayProduct.name}
          >
            {displayProduct.name}
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
        <ImageCarousel images={allImages} productName={displayProduct.name} />
        <ProductDetails
          product={displayProduct}
          onProductUpdate={setUpdatedProduct}
        />
      </div>
    </section>
  );
}
