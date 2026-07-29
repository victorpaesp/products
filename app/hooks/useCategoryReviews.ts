import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CategoryReviewsResult } from "~/types";
import { normalizeCategoryReviewsResponse } from "~/lib/category-reviews";
import { productsQueryKeys } from "~/lib/products-query";

export type CategoryReviewsQueryParams = {
  category?: string;
  product?: string;
  page: number;
};

const categoryReviewsQueryKeys = {
  all: ["category-reviews"] as const,
  lists: () => [...categoryReviewsQueryKeys.all, "list"] as const,
  list: (params: CategoryReviewsQueryParams) =>
    [...categoryReviewsQueryKeys.lists(), params] as const,
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

async function fetchCategoryReviews(
  params: CategoryReviewsQueryParams,
): Promise<CategoryReviewsResult> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  if (params.category) query.set("category", params.category);
  if (params.product) query.set("product", params.product);

  const response = await requestJson<unknown>(
    `/api/category-reviews?${query.toString()}`,
    { method: "GET" },
  );
  return normalizeCategoryReviewsResponse(response);
}

type ApproveCategoryReviewPayload = {
  reviewId: number;
  categoryId: number;
};

async function approveCategoryReview({
  reviewId,
  categoryId,
}: ApproveCategoryReviewPayload): Promise<unknown> {
  return requestJson(`/api/category-reviews/${reviewId}/approve`, {
    method: "PUT",
    body: JSON.stringify({ category_id: categoryId }),
  });
}

type RejectCategoryReviewPayload = {
  reviewId: number;
  reviewerNotes?: string;
};

async function rejectCategoryReview({
  reviewId,
  reviewerNotes,
}: RejectCategoryReviewPayload): Promise<unknown> {
  return requestJson(`/api/category-reviews/${reviewId}/reject`, {
    method: "PUT",
    body: JSON.stringify({
      ...(reviewerNotes ? { reviewer_notes: reviewerNotes } : {}),
    }),
  });
}

export function useCategoryReviewsQuery(params: CategoryReviewsQueryParams) {
  return useQuery({
    queryKey: categoryReviewsQueryKeys.list(params),
    queryFn: () => fetchCategoryReviews(params),
  });
}

function useReviewMutationInvalidation() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: categoryReviewsQueryKeys.all,
      }),
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.all }),
    ]);
  };
}

export function useApproveCategoryReviewMutation() {
  const invalidate = useReviewMutationInvalidation();

  return useMutation({
    mutationFn: approveCategoryReview,
    onSuccess: invalidate,
  });
}

export function useRejectCategoryReviewMutation() {
  const invalidate = useReviewMutationInvalidation();

  return useMutation({
    mutationFn: rejectCategoryReview,
    onSuccess: invalidate,
  });
}
