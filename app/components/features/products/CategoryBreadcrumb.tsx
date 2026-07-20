import { LoaderCircle } from "lucide-react";
import { Fragment } from "react";
import type { ProductCategory } from "~/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

type CategoryBreadcrumbProps = {
  path: ProductCategory[] | undefined;
  isLoading: boolean;
  onSelect: (slug: string | null) => void;
};

export function CategoryBreadcrumb({
  path,
  isLoading,
  onSelect,
}: CategoryBreadcrumbProps) {
  return (
    <div className="mb-5 flex min-h-5 items-center">
      {isLoading ? (
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          <LoaderCircle aria-hidden="true" className="animate-spin" />
          Carregando categoria...
        </span>
      ) : (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button type="button" onClick={() => onSelect(null)}>
                  Produtos
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            {path && path.length > 0 ? (
              path.map((category, index) => {
                const isLast = index === path.length - 1;
                return (
                  <Fragment key={category.slug}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{category.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <button
                            type="button"
                            onClick={() => onSelect(category.slug)}
                          >
                            {category.name}
                          </button>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast ? <BreadcrumbSeparator /> : null}
                  </Fragment>
                );
              })
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>Categoria não encontrada</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </div>
  );
}
