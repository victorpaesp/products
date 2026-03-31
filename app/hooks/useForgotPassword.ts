import { useMutation } from "@tanstack/react-query";

type ForgotPasswordPayload = {
  email: string;
};

type ForgotPasswordResponse = {
  ok?: boolean;
  error?: string;
};

async function sendForgotPasswordRequest(
  payload: ForgotPasswordPayload,
): Promise<ForgotPasswordResponse> {
  const formData = new FormData();
  formData.set("email", payload.email);

  const response = await fetch("/api/password-forgot", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  const body = (await response
    .json()
    .catch(() => null)) as ForgotPasswordResponse | null;

  if (!response.ok) {
    throw new Error(body?.error || "Erro ao enviar e-mail de recuperação.");
  }

  return body || { ok: true };
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: sendForgotPasswordRequest,
  });
}
