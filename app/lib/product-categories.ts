import type { ProductCategoryAssociation, ProductCategoryRef } from "~/types";

function normalizeCategoryRef(value: unknown): ProductCategoryRef | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const id = candidate.id;
  if (
    !(
      typeof id === "string" ||
      (typeof id === "number" && Number.isInteger(id))
    ) ||
    typeof candidate.name !== "string" ||
    typeof candidate.slug !== "string"
  ) {
    return null;
  }

  const parent = normalizeCategoryRef(candidate.parent);
  return {
    id: String(id),
    name: candidate.name,
    slug: candidate.slug,
    parent_id:
      typeof candidate.parent_id === "string" ||
      (typeof candidate.parent_id === "number" &&
        Number.isInteger(candidate.parent_id))
        ? String(candidate.parent_id)
        : null,
    parent: parent
      ? { id: parent.id, name: parent.name, slug: parent.slug }
      : null,
  };
}

export function normalizeProductCategories(
  raw: unknown,
): ProductCategoryAssociation[] {
  const data =
    raw && typeof raw === "object" && !Array.isArray(raw) && "data" in raw
      ? (raw as { data?: unknown }).data
      : raw;
  if (!Array.isArray(data))
    throw new Error("Erro ao carregar as categorias do produto.");

  return data.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const candidate = value as Record<string, unknown>;
    // O endpoint existe em duas formas: itens de associação (`category`) e
    // referências de categoria diretas. Normalize ambas para o mesmo formato.
    const category = normalizeCategoryRef(candidate.category ?? candidate);
    if (!category) return [];
    return [
      {
        id: typeof candidate.id === "string" ? candidate.id : category.id,
        category,
        score: typeof candidate.score === "number" ? candidate.score : 0,
        source:
          candidate.source === "manual"
            ? ("manual" as const)
            : ("auto" as const),
        created_at:
          typeof candidate.created_at === "string"
            ? candidate.created_at
            : null,
      },
    ];
  });
}
