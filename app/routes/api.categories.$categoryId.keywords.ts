import {
  data,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { requireAuth, requireSessionUser } from "~/lib/auth.server";
import { backendRequest, BackendApiError } from "~/lib/backend.server";
import { normalizeCategoryKeywordText } from "~/lib/categories";

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof BackendApiError) {
    return data({ error: error.message }, { status: error.status });
  }

  return data(
    { error: error instanceof Error ? error.message : fallback },
    { status: 500 },
  );
}

async function requireAdmin(request: Request) {
  const token = await requireAuth(request);
  const user = await requireSessionUser(request);

  if (user.role !== "admin") {
    throw data({ error: "Ação não permitida." }, { status: 403 });
  }

  return token;
}

function parseCategoryId(categoryId: string | undefined): number | null {
  if (!categoryId || !/^\d+$/.test(categoryId)) return null;
  return Number(categoryId);
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireAdmin(request);
  const categoryId = parseCategoryId(params.categoryId);

  if (categoryId === null) {
    return data({ error: "Categoria inválida." }, { status: 400 });
  }

  try {
    const search = new URL(request.url).searchParams.get("search");
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await backendRequest(
      `/categories/${categoryId}/keywords${query}`,
      { method: "GET", token },
    );
    return Response.json(response);
  } catch (error) {
    return errorResponse(error, "Erro ao carregar as palavras-chave.");
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireAdmin(request);
  const categoryId = parseCategoryId(params.categoryId);

  if (categoryId === null) {
    return data({ error: "Categoria inválida." }, { status: 400 });
  }

  if (request.method.toUpperCase() !== "POST") {
    return data({ error: "Método não permitido." }, { status: 405 });
  }

  try {
    const rawBody = await request.json();
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return data({ error: "Palavra-chave inválida." }, { status: 422 });
    }

    const candidate = rawBody as Record<string, unknown>;
    const keyword =
      typeof candidate.keyword === "string"
        ? normalizeCategoryKeywordText(candidate.keyword)
        : "";
    const weight = candidate.weight;

    if (!keyword) {
      return data({ error: "Informe a palavra-chave." }, { status: 422 });
    }

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
      `/categories/${categoryId}/keywords`,
      {
        method: "POST",
        token,
        body: { keyword, weight },
      },
    );
    return data(response, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Erro ao adicionar a palavra-chave.");
  }
}
