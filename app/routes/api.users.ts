import { ActionFunctionArgs, data, LoaderFunctionArgs } from "@remix-run/node";
import { backendRequest } from "~/lib/backend.server";
import { requireAuth, requireSessionUser } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireAuth(request);
  const user = await requireSessionUser(request);

  if (user.role !== "admin") {
    return Response.json({ error: "Ação não permitida." }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const perPage = url.searchParams.get("per_page") || "10";
  const search = url.searchParams.get("search") || "";

  const params = new URLSearchParams({
    page,
    per_page: perPage,
  });
  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await backendRequest(`/users?${params.toString()}`, {
    method: "GET",
    token,
  });

  return Response.json(response);
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await requireAuth(request);
  const user = await requireSessionUser(request);

  if (user.role !== "admin") {
    return data({ error: "Ação não permitida." }, { status: 403 });
  }

  const body = await request.json();

  const response = await backendRequest("/users", {
    method: "POST",
    token,
    body,
  });

  return data(response, { status: 201 });
}
