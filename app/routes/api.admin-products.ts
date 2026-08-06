import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { toAdminProductsResponse } from "~/lib/admin-products";
import { requireAdminSession } from "~/lib/auth.server";
import {
  backendGetProductCategories,
  BackendApiError,
} from "~/lib/backend.server";
import { normalizeProductCategories } from "~/lib/product-categories";
import { fetchProductsForRequest } from "~/lib/products.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { token } = await requireAdminSession(request);
  const url = new URL(request.url);

  try {
    const products = await fetchProductsForRequest({
      token,
      params: url.searchParams,
    });

    const categories = await Promise.all(
      products.data.map(async (product) =>
        normalizeProductCategories(
          await backendGetProductCategories({ token, productId: product.id }),
        ).map((association) => association.category),
      ),
    );

    const productsWithCategories = {
      ...products,
      data: products.data.map((product, index) => ({
        ...product,
        categories: categories[index],
      })),
    };

    return Response.json(toAdminProductsResponse(productsWithCategories));
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      throw redirect("/login");
    }

    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao carregar os produtos.";

    return Response.json({ error: message }, { status: 500 });
  }
}
