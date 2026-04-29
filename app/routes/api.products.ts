import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { BackendApiError } from "~/lib/backend.server";
import { requireAuth } from "~/lib/auth.server";
import { fetchProductsForRequest } from "~/lib/products.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireAuth(request);
  const url = new URL(request.url);

  try {
    const products = await fetchProductsForRequest({
      token,
      params: url.searchParams,
    });

    return Response.json(products);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      throw redirect("/login");
    }

    return Response.json(
      { error: "Erro ao carregar os produtos." },
      { status: 500 },
    );
  }
}
