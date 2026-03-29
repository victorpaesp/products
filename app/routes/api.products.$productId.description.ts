import { ActionFunctionArgs, data } from "@remix-run/node";
import { backendRequest } from "~/lib/backend.server";
import { requireAuth, requireSessionUser } from "~/lib/auth.server";
import type { ApiProductDescriptionActionData } from "~/types/routes";

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireAuth(request);
  const user = await requireSessionUser(request);

  if (user.role !== "admin") {
    return data<ApiProductDescriptionActionData>(
      { error: "Ação não permitida." },
      { status: 403 },
    );
  }

  const productId = params.productId;
  if (!productId) {
    return data<ApiProductDescriptionActionData>(
      { error: "Produto inválido." },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const rawDescription = String(formData.get("description_override") || "");
  const descriptionOverride = rawDescription.trim() || null;

  await backendRequest(`/products/${productId}/description`, {
    method: "PATCH",
    token,
    body: {
      description_override: descriptionOverride,
    },
  });

  return data<ApiProductDescriptionActionData>({
    ok: true,
    description_override: descriptionOverride,
  });
}
