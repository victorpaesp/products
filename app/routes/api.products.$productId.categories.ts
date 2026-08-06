import {
  data,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { requireAdminSession } from "~/lib/auth.server";
import { backendRequest, BackendApiError } from "~/lib/backend.server";

function errorResponse(error: unknown) {
  const status = error instanceof BackendApiError ? error.status : 500;
  const message =
    error instanceof Error ? error.message : "Erro ao alterar as categorias.";
  return data({ error: message }, { status });
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { token } = await requireAdminSession(request);
  if (!params.productId)
    return data({ error: "Produto inválido." }, { status: 400 });

  try {
    const response = await backendRequest(
      `/products/${params.productId}/categories`,
      {
        method: "GET",
        token,
      },
    );
    return Response.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { token } = await requireAdminSession(request);
  if (!params.productId)
    return data({ error: "Produto inválido." }, { status: 400 });
  if (request.method !== "POST")
    return data({ error: "Método não permitido." }, { status: 405 });

  try {
    const body = await request.json();
    const response = await backendRequest(
      `/products/${params.productId}/categories`,
      {
        method: "POST",
        token,
        body,
      },
    );
    return data(response, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
