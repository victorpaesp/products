import { ActionFunctionArgs, data } from "@remix-run/node";
import { backendRequest } from "~/lib/backend.server";
import { requireAuth, requireSessionUser } from "~/lib/auth.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireAuth(request);
  const user = await requireSessionUser(request);

  if (user.role !== "admin") {
    return data({ error: "Ação não permitida." }, { status: 403 });
  }

  const userId = params.userId;
  if (!userId) {
    return data({ error: "Usuário inválido." }, { status: 400 });
  }

  if (request.method.toUpperCase() === "DELETE") {
    await backendRequest(`/users/${userId}`, {
      method: "DELETE",
      token,
    });

    return data({ ok: true });
  }

  if (request.method.toUpperCase() === "PUT") {
    const body = await request.json();
    const response = await backendRequest(`/users/${userId}`, {
      method: "PUT",
      token,
      body,
    });

    return data(response);
  }

  return data({ error: "Método não permitido." }, { status: 405 });
}
