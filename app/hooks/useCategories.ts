import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminCategory,
  CategoryUpsertPayload,
  ProductCategory,
} from "~/types";

export const categoriesQueryKeys = {
  all: ["categories"] as const,
  tree: () => [...categoriesQueryKeys.all, "tree"] as const,
  manage: () => [...categoriesQueryKeys.all, "manage"] as const,
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
    | T
    | { error?: string }
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : undefined;
    throw new Error(message || "Erro inesperado na requisição.");
  }

  return payload as T;
}

async function fetchCategoriesQuery(token: string): Promise<ProductCategory[]> {
  return requestJson<ProductCategory[]>("/api/categories", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function fetchAdminCategoriesQuery(): Promise<AdminCategory[]> {
  return requestJson<AdminCategory[]>("/api/categories?view=manage", {
    method: "GET",
  });
}

type CategoryMutationPayload = {
  categoryId?: number;
  body: CategoryUpsertPayload;
};

async function upsertCategory({
  categoryId,
  body,
}: CategoryMutationPayload): Promise<unknown> {
  return requestJson(
    categoryId ? `/api/categories/${categoryId}` : "/api/categories",
    {
      method: categoryId ? "PUT" : "POST",
      body: JSON.stringify(body),
    },
  );
}

async function deleteCategory(categoryId: number): Promise<unknown> {
  return requestJson(`/api/categories/${categoryId}`, { method: "DELETE" });
}

export function useCategoriesQuery(token: string) {
  return useQuery({
    queryKey: categoriesQueryKeys.tree(),
    queryFn: () => fetchCategoriesQuery(token),
    staleTime: Infinity,
  });
}

export function useAdminCategoriesQuery() {
  return useQuery({
    queryKey: categoriesQueryKeys.manage(),
    queryFn: fetchAdminCategoriesQuery,
  });
}

export function useUpsertCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}
