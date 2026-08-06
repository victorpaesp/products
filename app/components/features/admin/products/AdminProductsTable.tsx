import { PackageOpen, Pencil } from "lucide-react";
import type { AdminProductListItem, ProductCategoryRef } from "~/types";
import { Badge, type BadgeProps } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type AdminProductsTableProps = {
  products: AdminProductListItem[];
  selectedProductId: string | null;
  onEdit: (productId: string | number) => void;
};

type DescriptionStatus = {
  label: string;
  variant: BadgeProps["variant"];
};

const CATEGORY_BADGE_LIMIT = 3;

function ProductCategoryBadges({
  categories,
  emptyAsBadge = false,
}: {
  categories: ProductCategoryRef[];
  emptyAsBadge?: boolean;
}) {
  if (!categories.length) {
    return emptyAsBadge ? (
      <Badge variant="outline">Sem categoria</Badge>
    ) : (
      <span className="text-muted-foreground text-sm">Sem categoria</span>
    );
  }

  const visibleCategories = categories.slice(0, CATEGORY_BADGE_LIMIT);
  const hiddenCategories = categories.slice(CATEGORY_BADGE_LIMIT);

  return (
    <>
      {visibleCategories.map((category) => (
        <Badge key={category.id} variant="outline">
          {category.name}
        </Badge>
      ))}
      {hiddenCategories.length ? (
        <Badge
          variant="secondary"
          title={hiddenCategories.map((category) => category.name).join(", ")}
          aria-label={`Mais ${hiddenCategories.length} categorias: ${hiddenCategories
            .map((category) => category.name)
            .join(", ")}`}
        >
          +{hiddenCategories.length}
        </Badge>
      ) : null}
    </>
  );
}

function getDescriptionStatus(
  product: AdminProductListItem,
): DescriptionStatus {
  if (product.description_source === "manual") {
    return { label: "Personalizada", variant: "secondary" };
  }

  if (!product.has_description) {
    return { label: "Sem descrição", variant: "destructive" };
  }

  return { label: "Original", variant: "outline" };
}

function ProductThumbnail({ product }: { product: AdminProductListItem }) {
  return (
    <div className="bg-muted relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
      <PackageOpen
        className="text-muted-foreground size-5"
        aria-hidden="true"
      />
      {product.thumbnail ? (
        <img
          src={product.thumbnail}
          alt=""
          loading="lazy"
          width={48}
          height={48}
          className="bg-background absolute inset-0 size-full object-contain"
          onError={(event) => event.currentTarget.remove()}
        />
      ) : null}
    </div>
  );
}

export function AdminProductsTable({
  products,
  selectedProductId,
  onEdit,
}: AdminProductsTableProps) {
  return (
    <>
      <div className="border-border bg-card hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="w-56">Fornecedor</TableHead>
              <TableHead className="w-64">Categorias</TableHead>
              <TableHead className="w-44">Descrição</TableHead>
              <TableHead className="w-28 text-right">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const status = getDescriptionStatus(product);
              const selected = selectedProductId === String(product.id);

              return (
                <TableRow
                  key={product.id}
                  data-state={selected ? "selected" : undefined}
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onEdit(product.id)}
                      className="focus-visible:ring-ring flex min-h-12 max-w-xl items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2"
                      aria-label={`Editar ${product.name}`}
                    >
                      <ProductThumbnail product={product} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-medium">
                          {product.name}
                        </span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          Cód. {product.product_cod}
                        </span>
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.supplier.name || "Não informado"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <ProductCategoryBadges categories={product.categories} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product.id)}
                      aria-label={`Editar ${product.name}`}
                    >
                      <Pencil data-icon="inline-start" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden" aria-label="Produtos">
        {products.map((product) => {
          const status = getDescriptionStatus(product);

          return (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onEdit(product.id)}
                className="border-border bg-card focus-visible:ring-ring flex min-h-20 w-full items-center gap-3 rounded-lg border p-3 text-left shadow-xs outline-none focus-visible:ring-2"
                aria-label={`Editar ${product.name}`}
              >
                <ProductThumbnail product={product} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-medium">{product.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {product.supplier.name || "Fornecedor não informado"}
                    {" · "}Cód. {product.product_cod}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <ProductCategoryBadges
                      categories={product.categories}
                      emptyAsBadge
                    />
                  </div>
                </div>
                <Pencil className="text-muted-foreground size-4 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
