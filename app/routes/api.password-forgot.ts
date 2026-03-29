import { ActionFunctionArgs, data } from "@remix-run/node";
import { backendRequest, BackendApiError } from "~/lib/backend.server";
import type { ApiForgotPasswordActionData } from "~/types/routes";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    return data<ApiForgotPasswordActionData>(
      { error: "Email é obrigatório." },
      { status: 400 },
    );
  }

  try {
    await backendRequest("/password/forgot", {
      method: "POST",
      body: { email },
    });

    return data<ApiForgotPasswordActionData>({ ok: true });
  } catch (error) {
    if (error instanceof BackendApiError) {
      const backendMessage =
        typeof error.payload === "object" && error.payload !== null
          ? (error.payload as { message?: string }).message
          : undefined;

      return data<ApiForgotPasswordActionData>(
        { error: backendMessage || "Erro ao enviar e-mail de recuperação." },
        { status: error.status },
      );
    }

    return data<ApiForgotPasswordActionData>(
      { error: "Erro ao enviar e-mail de recuperação." },
      { status: 500 },
    );
  }
}
