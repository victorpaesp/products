import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminCategory,
  CategoryKeyword,
  CategoryKeywordPayload,
  CategoryUpsertPayload,
  ProductCategory,
} from "~/types";
import {
  normalizeAdminCategoriesResponse,
  normalizeCategoryKeywordsResponse,
  normalizeCategoriesResponse,
} from "~/lib/categories";

export const categoriesQueryKeys = {
  all: ["categories"] as const,
  tree: () => [...categoriesQueryKeys.all, "tree"] as const,
  manage: () => [...categoriesQueryKeys.all, "manage"] as const,
  keywords: (categoryId: number) =>
    [...categoriesQueryKeys.all, "keywords", categoryId] as const,
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
  const response = await requestJson<unknown>("/api/categories", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return normalizeCategoriesResponse(response);
}

async function fetchAdminCategoriesQuery(): Promise<AdminCategory[]> {
  const response = await requestJson<unknown>("/api/categories?view=manage", {
    method: "GET",
  });

  return normalizeAdminCategoriesResponse(response);
}

async function fetchCategoryKeywordsQuery(
  categoryId: number,
): Promise<CategoryKeyword[]> {
  const response = await requestJson<unknown>(
    `/api/categories/${categoryId}/keywords`,
    { method: "GET" },
  );

  return normalizeCategoryKeywordsResponse(response);
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

type AddCategoryKeywordPayload = {
  categoryId: number;
  body: CategoryKeywordPayload;
};

async function addCategoryKeyword({
  categoryId,
  body,
}: AddCategoryKeywordPayload): Promise<unknown> {
  return requestJson(`/api/categories/${categoryId}/keywords`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

type UpdateCategoryKeywordPayload = {
  keywordId: number;
  weight: number;
};

async function updateCategoryKeyword({
  keywordId,
  weight,
}: UpdateCategoryKeywordPayload): Promise<unknown> {
  return requestJson(`/api/categories/keywords/${keywordId}`, {
    method: "PUT",
    body: JSON.stringify({ weight }),
  });
}

type DeleteCategoryKeywordPayload = {
  keywordId: number;
};

async function deleteCategoryKeyword({
  keywordId,
}: DeleteCategoryKeywordPayload): Promise<unknown> {
  return requestJson(`/api/categories/keywords/${keywordId}`, {
    method: "DELETE",
  });
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

export function useCategoryKeywordsQuery(categoryId: number) {
  return useQuery({
    queryKey: categoriesQueryKeys.keywords(categoryId),
    queryFn: () => fetchCategoryKeywordsQuery(categoryId),
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

export function useAddCategoryKeywordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCategoryKeyword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}

export function useUpdateCategoryKeywordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategoryKeyword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}

export function useDeleteCategoryKeywordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategoryKeyword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}
