import type { AdminCategory, CategoryKeyword, ProductCategory } from "~/types";

const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g;

export function normalizeCategoryKeywordText(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(COMBINING_MARKS_PATTERN, "")
    .toLowerCase();
}

export type CategoryIndex = {
  bySlug: Map<string, ProductCategory>;
  pathsBySlug: Map<string, ProductCategory[]>;
  duplicateSlugs: Set<string>;
};

function normalizeCategory(
  value: unknown,
  ancestors: Set<object>,
): ProductCategory | null {
  if (!value || typeof value !== "object" || ancestors.has(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const slug = typeof candidate.slug === "string" ? candidate.slug.trim() : "";

  if (!name || !slug || candidate.active === false) {
    return null;
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  const rawChildren = Array.isArray(candidate.children)
    ? candidate.children
    : [];
  const children = rawChildren
    .map((child) => normalizeCategory(child, nextAncestors))
    .filter((child): child is ProductCategory => child !== null);

  const id =
    typeof candidate.id === "number" && Number.isInteger(candidate.id)
      ? candidate.id
      : undefined;

  return { id, name, slug, children };
}

export function normalizeCategoriesResponse(raw: unknown): ProductCategory[] {
  const candidate =
    raw && typeof raw === "object" && !Array.isArray(raw) && "data" in raw
      ? (raw as { data?: unknown }).data
      : raw;

  if (!Array.isArray(candidate)) {
    throw new Error("Erro ao carregar as categorias.");
  }

  return candidate
    .map((category) => normalizeCategory(category, new Set()))
    .filter((category): category is ProductCategory => category !== null);
}

function normalizeKeyword(value: unknown): CategoryKeyword | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "number" ||
    typeof candidate.category_id !== "number" ||
    typeof candidate.keyword !== "string" ||
    typeof candidate.weight !== "number"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    category_id: candidate.category_id,
    keyword: candidate.keyword,
    weight: candidate.weight,
    created_at:
      typeof candidate.created_at === "string" ? candidate.created_at : "",
  };
}

export function normalizeCategoryKeywordsResponse(
  raw: unknown,
): CategoryKeyword[] {
  const candidate =
    raw && typeof raw === "object" && !Array.isArray(raw) && "data" in raw
      ? (raw as { data?: unknown }).data
      : raw;

  if (!Array.isArray(candidate)) {
    throw new Error("Erro ao carregar as palavras-chave.");
  }

  return candidate
    .map(normalizeKeyword)
    .filter((keyword): keyword is CategoryKeyword => keyword !== null);
}

function normalizeAdminCategory(
  value: unknown,
  ancestors: Set<object>,
): AdminCategory | null {
  if (!value || typeof value !== "object" || ancestors.has(value)) return null;

  const candidate = value as Record<string, unknown>;
  const id = candidate.id;
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const slug = typeof candidate.slug === "string" ? candidate.slug.trim() : "";

  if (typeof id !== "number" || !Number.isInteger(id) || !name || !slug) {
    return null;
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  const children = (Array.isArray(candidate.children) ? candidate.children : [])
    .map((child) => normalizeAdminCategory(child, nextAncestors))
    .filter((child): child is AdminCategory => child !== null);
  const keywords = (Array.isArray(candidate.keywords) ? candidate.keywords : [])
    .map(normalizeKeyword)
    .filter((keyword): keyword is CategoryKeyword => keyword !== null);

  return {
    id,
    name,
    slug,
    parent_id:
      typeof candidate.parent_id === "number" ? candidate.parent_id : null,
    description:
      typeof candidate.description === "string" && candidate.description.trim()
        ? candidate.description.trim()
        : null,
    active: candidate.active !== false,
    keywords,
    children,
    created_at:
      typeof candidate.created_at === "string"
        ? candidate.created_at
        : undefined,
    updated_at:
      typeof candidate.updated_at === "string"
        ? candidate.updated_at
        : undefined,
  };
}

export function normalizeAdminCategoriesResponse(
  raw: unknown,
): AdminCategory[] {
  const candidate =
    raw && typeof raw === "object" && !Array.isArray(raw) && "data" in raw
      ? (raw as { data?: unknown }).data
      : raw;

  if (!Array.isArray(candidate)) {
    throw new Error("Erro ao carregar as categorias.");
  }

  return candidate
    .map((category) => normalizeAdminCategory(category, new Set()))
    .filter((category): category is AdminCategory => category !== null);
}

function findAdminCategory(
  categories: AdminCategory[],
  categoryId: number,
): AdminCategory | null {
  for (const category of categories) {
    if (category.id === categoryId) return category;
    const child = findAdminCategory(category.children, categoryId);
    if (child) return child;
  }

  return null;
}

export function validateAdminCategoryParent(
  categories: AdminCategory[],
  parentId: number,
  categoryId?: number,
): string | null {
  if (parentId === categoryId) {
    return "Uma categoria não pode ser pai dela mesma.";
  }

  const parent = findAdminCategory(categories, parentId);
  if (!parent) return "Categoria pai não encontrada.";
  if (parent.parent_id !== null) {
    return "Somente categorias principais podem receber subcategorias.";
  }

  if (categoryId !== undefined) {
    const category = findAdminCategory(categories, categoryId);
    if (category && category.children.length > 0) {
      return "Categorias que possuem filhas devem permanecer como principais.";
    }
  }

  return null;
}

export function buildCategoryIndex(
  categories: ProductCategory[],
): CategoryIndex {
  const bySlug = new Map<string, ProductCategory>();
  const pathsBySlug = new Map<string, ProductCategory[]>();
  const duplicateSlugs = new Set<string>();
  const visited = new WeakSet<object>();

  const visit = (category: ProductCategory, path: ProductCategory[]) => {
    if (visited.has(category)) return;
    visited.add(category);

    const nextPath = [...path, category];
    if (bySlug.has(category.slug)) {
      duplicateSlugs.add(category.slug);
    } else {
      bySlug.set(category.slug, category);
      pathsBySlug.set(category.slug, nextPath);
    }

    for (const child of category.children) {
      visit(child, nextPath);
    }
  };

  for (const category of categories) {
    visit(category, []);
  }

  return { bySlug, pathsBySlug, duplicateSlugs };
}
