import { data, type LoaderFunctionArgs } from "@remix-run/node";
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
          : "Erro ao carregar as revisões de classificação.",
    },
    { status: 500 },
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireAuth(request);
  const user = await requireSessionUser(request);

  if (user.role !== "admin") {
    return data({ error: "Ação não permitida." }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const query = new URLSearchParams();
    const category = url.searchParams.get("category")?.trim();
    const product = url.searchParams.get("product")?.trim();
    const rawPage = Number(url.searchParams.get("page"));
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

    if (category) query.set("category", category);
    if (product) query.set("product", product);
    query.set("page", String(page));

    const response = await backendRequest(
      `/category-reviews?${query.toString()}`,
      { method: "GET", token },
    );
    return Response.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}
