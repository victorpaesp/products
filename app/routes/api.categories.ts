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
  backendListCategoryTree,
  backendRequest,
  BackendApiError,
} from "~/lib/backend.server";
import {
  normalizeAdminCategoriesResponse,
  normalizeCategoryKeywordText,
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

    const response = manageView
      ? await backendListCategories({ token })
      : await backendListCategoryTree({ token });
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
    const rawBody = await request.json();
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return data({ error: "Dados da categoria inválidos." }, { status: 422 });
    }

    const rawKeywords = (rawBody as Record<string, unknown>).keywords;
    if (!Array.isArray(rawKeywords) || rawKeywords.length === 0) {
      return data(
        { error: "Informe ao menos uma palavra-chave." },
        { status: 422 },
      );
    }

    const keywords = [];
    for (const rawKeyword of rawKeywords) {
      if (!rawKeyword || typeof rawKeyword !== "object") {
        return data({ error: "Palavra-chave inválida." }, { status: 422 });
      }

      const candidate = rawKeyword as Record<string, unknown>;
      const keyword =
        typeof candidate.keyword === "string"
          ? normalizeCategoryKeywordText(candidate.keyword)
          : "";
      const weight = candidate.weight;

      if (!keyword) {
        return data(
          { error: "Preencha todas as palavras-chave." },
          { status: 422 },
        );
      }

      if (
        typeof weight !== "number" ||
        !Number.isInteger(weight) ||
        weight < 1 ||
        weight > 5
      ) {
        return data(
          { error: "O peso de cada palavra-chave deve estar entre 1 e 5." },
          { status: 422 },
        );
      }

      keywords.push({ keyword, weight });
    }

    if (
      new Set(keywords.map(({ keyword }) => keyword)).size !== keywords.length
    ) {
      return data(
        { error: "Não repita palavras-chave na mesma categoria." },
        { status: 422 },
      );
    }

    const body = { ...rawBody, keywords };
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
