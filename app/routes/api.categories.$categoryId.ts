import { data, type ActionFunctionArgs } from "@remix-run/node";
import { requireAuth, requireSessionUser } from "~/lib/auth.server";
import {
  backendListCategories,
  backendRequest,
  BackendApiError,
} from "~/lib/backend.server";
import {
  normalizeAdminCategoriesResponse,
  validateAdminCategoryParent,
} from "~/lib/categories";

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
  const categoryId = params.categoryId;

  if (user.role !== "admin") {
    return data({ error: "Ação não permitida." }, { status: 403 });
  }

  if (!categoryId || !/^\d+$/.test(categoryId)) {
    return data({ error: "Categoria inválida." }, { status: 400 });
  }

  const method = request.method.toUpperCase();

  try {
    if (method === "PUT") {
      const body = await request.json();
      const parentId =
        body && typeof body === "object" && "parent_id" in body
          ? (body as { parent_id?: unknown }).parent_id
          : undefined;

      if (
        parentId !== undefined &&
        parentId !== null &&
        (typeof parentId !== "number" || !Number.isInteger(parentId))
      ) {
        return data({ error: "Categoria pai inválida." }, { status: 422 });
      }

      if (typeof parentId === "number") {
        const categoriesResponse = await backendListCategories({ token });
        const categories = normalizeAdminCategoriesResponse(categoriesResponse);
        const hierarchyError = validateAdminCategoryParent(
          categories,
          parentId,
          Number(categoryId),
        );
        if (hierarchyError) {
          return data({ error: hierarchyError }, { status: 422 });
        }
      }

      const response = await backendRequest(`/categories/${categoryId}`, {
        method: "PUT",
        token,
        body,
      });
      return data(response);
    }

    if (method === "DELETE") {
      const response = await backendRequest(`/categories/${categoryId}`, {
        method: "DELETE",
        token,
      });
      return data(response);
    }

    return data({ error: "Método não permitido." }, { status: 405 });
  } catch (error) {
    return errorResponse(error, "Erro ao alterar a categoria.");
  }
}
