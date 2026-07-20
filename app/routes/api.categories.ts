import {
  data,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  requireAuth,
  requireSessionUser,
  resolveAuthToken,
} from "~/lib/auth.server";
import {
  backendListCategories,
  backendRequest,
  BackendApiError,
} from "~/lib/backend.server";
import {
  normalizeAdminCategoriesResponse,
  normalizeCategoriesResponse,
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

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await resolveAuthToken(request);
  const url = new URL(request.url);
  const manageView = url.searchParams.get("view") === "manage";

  try {
    if (manageView) {
      const user = await requireSessionUser(request);
      if (user.role !== "admin") {
        return data({ error: "Ação não permitida." }, { status: 403 });
      }
    }

    const response = await backendListCategories({ token });
    return Response.json(
      manageView
        ? normalizeAdminCategoriesResponse(response)
        : normalizeCategoriesResponse(response),
    );
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      throw redirect("/login");
    }

    return errorResponse(error, "Erro ao carregar as categorias.");
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await requireAuth(request);
  const user = await requireSessionUser(request);

  if (user.role !== "admin") {
    return data({ error: "Ação não permitida." }, { status: 403 });
  }

  if (request.method.toUpperCase() !== "POST") {
    return data({ error: "Método não permitido." }, { status: 405 });
  }

  try {
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
      const hierarchyError = validateAdminCategoryParent(categories, parentId);
      if (hierarchyError) {
        return data({ error: hierarchyError }, { status: 422 });
      }
    }

    const response = await backendRequest("/categories", {
      method: "POST",
      token,
      body,
    });
    return data(response, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Erro ao criar a categoria.");
  }
}
