import { data, type ActionFunctionArgs } from "@remix-run/node";
import { requireAuth, requireSessionUser } from "~/lib/auth.server";
import { backendRequest, BackendApiError } from "~/lib/backend.server";

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof BackendApiError) {
    return data({ error: error.message }, { status: error.status });
  }

  return data(
    { error: error instanceof Error ? error.message : fallback },
    { status: 500 },
  );
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireAuth(request);
  const user = await requireSessionUser(request);
  const keywordId = params.keywordId;

  if (user.role !== "admin") {
    return data({ error: "Ação não permitida." }, { status: 403 });
  }

  if (!keywordId || !/^\d+$/.test(keywordId)) {
    return data({ error: "Palavra-chave inválida." }, { status: 400 });
  }

  const method = request.method.toUpperCase();

  try {
    if (method === "PUT") {
      const rawBody = await request.json();
      const weight =
        rawBody && typeof rawBody === "object" && "weight" in rawBody
          ? (rawBody as { weight?: unknown }).weight
          : undefined;

      if (
        typeof weight !== "number" ||
        !Number.isInteger(weight) ||
        weight < 1 ||
        weight > 5
      ) {
        return data(
          { error: "O peso da palavra-chave deve estar entre 1 e 5." },
          { status: 422 },
        );
      }

      const response = await backendRequest(
        `/categories/keywords/${keywordId}`,
        {
          method: "PUT",
          token,
          body: { weight },
        },
      );
      return data(response);
    }

    if (method === "DELETE") {
      const response = await backendRequest(
        `/categories/keywords/${keywordId}`,
        {
          method: "DELETE",
          token,
        },
      );
      return data(response);
    }

    return data({ error: "Método não permitido." }, { status: 405 });
  } catch (error) {
    return errorResponse(error, "Erro ao alterar a palavra-chave.");
  }
}
