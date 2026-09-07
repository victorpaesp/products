import type {
  CategoryReview,
  CategoryReviewsPagination,
  CategoryReviewsResult,
  CategoryReviewStatus,
} from "~/types";

const REVIEW_STATUSES = new Set<CategoryReviewStatus>([
  "pending",
  "approved",
  "rejected",
]);

function normalizePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

function normalizeReview(value: unknown): CategoryReview | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const rawProduct = candidate.product;
  if (!rawProduct || typeof rawProduct !== "object") return null;

  const product = rawProduct as Record<string, unknown>;
  if (
    typeof candidate.id !== "number" ||
    !Number.isInteger(candidate.id) ||
    typeof candidate.score !== "number" ||
    typeof candidate.status !== "string" ||
    !REVIEW_STATUSES.has(candidate.status as CategoryReviewStatus) ||
    typeof product.id !== "number" ||
    !Number.isInteger(product.id) ||
    typeof product.name !== "string" ||
    !product.name.trim()
  ) {
    return null;
  }

  const rawSuggestedCategory = candidate.suggested_category;
  let suggestedCategory: CategoryReview["suggested_category"] = null;

  if (rawSuggestedCategory && typeof rawSuggestedCategory === "object") {
    const suggested = rawSuggestedCategory as Record<string, unknown>;
    if (
      typeof suggested.id === "number" &&
      Number.isInteger(suggested.id) &&
      typeof suggested.name === "string" &&
      suggested.name.trim()
    ) {
      suggestedCategory = {
        id: suggested.id,
        name: suggested.name.trim(),
        parent:
          typeof suggested.parent === "string" && suggested.parent.trim()
            ? suggested.parent.trim()
            : null,
      };
    }
  }

  return {
    id: candidate.id,
    score: candidate.score,
    status: candidate.status as CategoryReviewStatus,
    product: {
      id: product.id,
      name: product.name.trim(),
      provider:
        typeof product.provider === "string" ? product.provider.trim() : "",
    },
    suggested_category: suggestedCategory,
    created_at:
      typeof candidate.created_at === "string" ? candidate.created_at : "",
  };
}

function normalizePagination(value: unknown): CategoryReviewsPagination {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    total:
      typeof candidate.total === "number" && candidate.total >= 0
        ? candidate.total
        : 0,
    per_page: normalizePositiveInteger(candidate.per_page, 10),
    current_page: normalizePositiveInteger(candidate.current_page, 1),
    last_page: normalizePositiveInteger(candidate.last_page, 1),
  };
}

export function normalizeCategoryReviewsResponse(
  raw: unknown,
): CategoryReviewsResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Erro ao carregar as revisões de classificação.");
  }

  const candidate = raw as Record<string, unknown>;
  if (!Array.isArray(candidate.data)) {
    throw new Error("Erro ao carregar as revisões de classificação.");
  }

  return {
    reviews: candidate.data
      .map(normalizeReview)
      .filter((review): review is CategoryReview => review !== null),
    pagination: normalizePagination(candidate.pagination),
  };
}
