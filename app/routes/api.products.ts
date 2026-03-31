import { data, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { BackendApiError } from "~/lib/backend.server";
import { requireAuth } from "~/lib/auth.server";
import { fetchProductsForRequest } from "~/lib/products.server";
import {
  getProductsQueryParams,
  toProductsApiParams,
} from "~/lib/products-query";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireAuth(request);
  const url = new URL(request.url);

  try {
    const queryParams = getProductsQueryParams(url.searchParams);
    const products = await fetchProductsForRequest({
      token,
      params: toProductsApiParams(queryParams),
    });

    return data(products);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      throw redirect("/login");
    }

    return data({ error: "Erro ao carregar os produtos." }, { status: 500 });
  }
}
