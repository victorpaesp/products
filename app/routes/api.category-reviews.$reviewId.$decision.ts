import { data, type ActionFunctionArgs } from "@remix-run/node";
import { requireAuth, requireSessionUser } from "~/lib/auth.server";
import { backendRequest, BackendApiError } from "~/lib/backend.server";

function errorResponse(error: unknown) {
  if (error instanceof BackendApiError) {
    return data({ error: error.message }, { status: error.status });
  }

  return data(
    {
      error:
        error instanceof Error
          ? error.message
          : "Erro ao processar a revisão de classificação.",
    },
    { status: 500 },
  );
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireAuth(request);
  const user = await requireSessionUser(request);
  const reviewId = params.reviewId;
  const decision = params.decision;

  if (user.role !== "admin") {
    return data({ error: "Ação não permitida." }, { status: 403 });
  }

  if (!reviewId || !/^\d+$/.test(reviewId)) {
    return data({ error: "Revisão inválida." }, { status: 400 });
  }

  if (decision !== "approve" && decision !== "reject") {
    return data({ error: "Decisão inválida." }, { status: 400 });
  }

  if (request.method.toUpperCase() !== "PUT") {
    return data({ error: "Método não permitido." }, { status: 405 });
  }

  try {
    const rawBody = await request.json().catch(() => ({}));
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return data({ error: "Dados da revisão inválidos." }, { status: 422 });
    }

    const candidate = rawBody as Record<string, unknown>;
    let body: Record<string, unknown> = {};

    if (decision === "approve") {
      const categoryId = candidate.category_id;
      if (
        typeof categoryId !== "number" ||
        !Number.isInteger(categoryId) ||
        categoryId <= 0
      ) {
        return data(
          { error: "Selecione a categoria final do produto." },
          { status: 422 },
        );
      }
      body = { category_id: categoryId };
    } else {
      const reviewerNotes =
        typeof candidate.reviewer_notes === "string"
          ? candidate.reviewer_notes.trim()
          : "";
      body = reviewerNotes ? { reviewer_notes: reviewerNotes } : {};
    }

    const response = await backendRequest(
      `/category-reviews/${reviewId}/${decision}`,
      { method: "PUT", token, body },
    );
    return data(response);
  } catch (error) {
    return errorResponse(error);
  }
}
