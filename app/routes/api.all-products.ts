import { LoaderFunctionArgs } from "@remix-run/node";
import { BackendApiError } from "~/lib/backend.server";
import { getSessionToken } from "~/lib/auth.server";
import { fetchProductsForRequest } from "~/lib/products.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getSessionToken(request);
  if (!token) {
    return Response.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    const products = await fetchProductsForRequest({
      token,
      params: url.searchParams,
    });

    return Response.json(products);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      return Response.json({ error: "Sessão expirada." }, { status: 401 });
    }

    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao carregar os produtos.";

    return Response.json({ error: message }, { status: 500 });
  }
}
