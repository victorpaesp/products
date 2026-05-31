import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { BackendApiError } from "~/lib/backend.server";
import { resolveAuthToken } from "~/lib/auth.server";
import { fetchProductById } from "~/lib/products.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await resolveAuthToken(request);
  const productId = params.productId;

  if (!productId) {
    return Response.json({ error: "Produto inválido." }, { status: 400 });
  }

  const url = new URL(request.url);
  const variationId = url.searchParams.get("variation_id") ?? undefined;

  try {
    const product = await fetchProductById({
      token,
      productId,
      variationId,
    });

    return Response.json(product);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      throw redirect("/login");
    }

    const message =
      error instanceof BackendApiError
        ? error.message
        : "Erro ao carregar o produto.";

    return Response.json({ error: message }, { status: 500 });
  }
}
