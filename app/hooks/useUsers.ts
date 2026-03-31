import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UsersTableUser } from "~/types/components";

type UsersListParams = {
  page: number;
  perPage: number;
  search?: string;
};

type UsersListResponse = {
  data: UsersTableUser[];
  last_page: number;
};

type UserUpsertPayload = {
  userId?: string | number;
  body: Record<string, unknown>;
};

export const usersQueryKeys = {
  all: ["users"] as const,
  lists: () => [...usersQueryKeys.all, "list"] as const,
  list: (params: UsersListParams) =>
    [...usersQueryKeys.lists(), params] as const,
};

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "same-origin",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : "Erro inesperado na requisição.";
    throw new Error(errorMessage || "Erro inesperado na requisição.");
  }

  return payload as T;
}

async function fetchUsersList(
  params: UsersListParams,
): Promise<UsersListResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    per_page: String(params.perPage),
  });

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  return requestJson<UsersListResponse>(`/api/users?${query.toString()}`, {
    method: "GET",
  });
}

async function upsertUser(payload: UserUpsertPayload): Promise<unknown> {
  const isEdit = payload.userId !== undefined;
  const endpoint = isEdit ? `/api/users/${payload.userId}` : "/api/users";

  return requestJson(endpoint, {
    method: isEdit ? "PUT" : "POST",
    body: JSON.stringify(payload.body),
  });
}

async function deleteUser(userId: string | number): Promise<{ ok?: boolean }> {
  return requestJson<{ ok?: boolean }>(`/api/users/${userId}`, {
    method: "DELETE",
  });
}

export function useUsersQuery(params: UsersListParams) {
  return useQuery({
    queryKey: usersQueryKeys.list(params),
    queryFn: () => fetchUsersList(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateOrUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() });
    },
  });
}
