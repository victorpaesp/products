import { data, type ActionFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "~/lib/auth.server";
import { backendRequest, BackendApiError } from "~/lib/backend.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { token } = await requireAdminSession(request);
  if (!params.productId || !params.categoryId) {
    return data({ error: "Produto ou categoria inválida." }, { status: 400 });
  }
  if (request.method !== "DELETE") {
    return data({ error: "Método não permitido." }, { status: 405 });
  }

  try {
    await backendRequest(
      `/products/${params.productId}/categories/${params.categoryId}`,
      { method: "DELETE", token },
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof BackendApiError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Erro ao remover a categoria.";
    return data({ error: message }, { status });
  }
}
