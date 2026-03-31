import { useMutation } from "@tanstack/react-query";
import type { SettingsActionData } from "~/types/routes";

type UpdateProfilePayload = {
  name: string;
  email: string;
  phone: string;
};

type UpdatePasswordPayload = {
  password: string;
};

async function submitSettingsIntent(
  intent: "update-profile" | "update-password",
  payload: Record<string, string>,
): Promise<SettingsActionData> {
  const formData = new FormData();
  formData.set("intent", intent);

  Object.entries(payload).forEach(([key, value]) => {
    formData.set(key, value);
  });

  const response = await fetch("/settings", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  const body = (await response
    .json()
    .catch(() => null)) as SettingsActionData | null;

  if (!response.ok) {
    throw new Error(body?.error || "Erro ao atualizar configurações.");
  }

  return body || { ok: true };
}

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      submitSettingsIntent("update-profile", payload),
  });
}

export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) =>
      submitSettingsIntent("update-password", payload),
  });
}
