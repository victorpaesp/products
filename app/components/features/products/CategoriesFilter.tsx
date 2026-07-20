import {
  Check,
  ChevronDown,
  Layers3,
  LoaderCircle,
  RotateCw,
  Settings2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@remix-run/react";
import type { ProductCategory } from "~/types";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

type CategoriesFilterProps = {
  categories: ProductCategory[];
  selectedCategory: ProductCategory | null;
  selectedSlug: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isAdmin: boolean;
  onSelect: (slug: string | null) => void;
  onRetry: () => void;
};

type CategoryItemProps = {
  category: ProductCategory;
  selectedCategory: ProductCategory | null;
  onSelect: (slug: string) => void;
  root?: boolean;
};

function CategoryItem({
  category,
  selectedCategory,
  onSelect,
  root = false,
}: CategoryItemProps) {
  const selected = category === selectedCategory;

  return (
    <li className={cn("mb-1 min-w-0", root && "mb-3 break-inside-avoid")}>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        className={cn(
          "focus-visible:ring-ring text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-sm py-0.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          root && "text-foreground font-semibold",
          selected && "text-primary font-medium",
        )}
        onClick={() => onSelect(category.slug)}
      >
        <span className="wrap-break-word">{category.name}</span>
        {selected ? (
          <Check aria-hidden="true" className="size-3.5 shrink-0" />
        ) : null}
      </button>

      {category.children.length > 0 ? (
        <ul className="border-border ml-1 flex flex-col border-l pl-2">
          {category.children.map((child) => (
            <CategoryItem
              key={child.id ?? child.slug}
              category={child}
              selectedCategory={selectedCategory}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

type CategoryMenuContentProps = CategoriesFilterProps;

function CategoryMenuContent({
  categories,
  selectedCategory,
  selectedSlug,
  isLoading,
  isError,
  errorMessage,
  onSelect,
  onRetry,
}: CategoryMenuContentProps) {
  if (isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-32 items-center justify-center gap-2 p-6 text-sm">
        <LoaderCircle aria-hidden="true" className="animate-spin" />
        Carregando categorias...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-muted-foreground text-sm">
          {errorMessage || "Não foi possível carregar as categorias."}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RotateCw data-icon="inline-start" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground flex min-h-32 items-center justify-center p-6 text-center text-sm">
        Nenhuma categoria disponível.
      </p>
    );
  }

  return (
    <>
      {selectedSlug ? (
        <div className="border-border flex justify-end border-b px-3 pb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelect(null)}
          >
            <X data-icon="inline-start" />
            Limpar categoria
          </Button>
        </div>
      ) : null}

      <ScrollArea className="h-[min(32rem,65vh)]">
        <ul className="columns-1 gap-x-6 p-3 md:columns-2 lg:columns-3">
          {categories.map((category) => (
            <CategoryItem
              key={category.id ?? category.slug}
              category={category}
              selectedCategory={selectedCategory}
              onSelect={(slug) => onSelect(slug)}
              root
            />
          ))}
        </ul>
      </ScrollArea>
    </>
  );
}

export function CategoriesFilter(props: CategoriesFilterProps) {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectCategory = (slug: string | null) => {
    props.onSelect(slug);
    setDesktopOpen(false);
    setMobileOpen(false);
  };

  const buttonLabel = props.selectedCategory?.name ?? "Categorias";

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className="h-9 w-full justify-between sm:w-52"
      aria-label={
        props.selectedCategory
          ? `Categoria selecionada: ${props.selectedCategory.name}`
          : "Selecionar categoria"
      }
    >
      <span className="flex min-w-0 items-center gap-2">
        {!props.selectedCategory ? <Layers3 data-icon="inline-start" /> : null}
        <span className="truncate text-sm">{buttonLabel}</span>
      </span>
      <ChevronDown data-icon="inline-end" />
    </Button>
  );

  const contentProps = { ...props, onSelect: selectCategory };

  const managerLink = props.isAdmin ? (
    <Button type="button" className="shrink-0" asChild>
      <Link
        to="/settings?tab=manage-categories"
        onClick={() => {
          setDesktopOpen(false);
          setMobileOpen(false);
        }}
      >
        <Settings2 data-icon="inline-start" />
        Gerenciar categorias
      </Link>
    </Button>
  ) : null;

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto">
      <span className="mb-1 text-sm whitespace-nowrap sm:mb-0">
        Filtrar por categoria:
      </span>

      <div className="hidden md:block">
        <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[min(56rem,calc(100vw-2rem))] p-0"
          >
            <PopoverHeader className="px-4 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <PopoverTitle>Categorias</PopoverTitle>
                  <PopoverDescription>
                    Selecione uma categoria principal ou um de seus níveis.
                  </PopoverDescription>
                </div>
                {managerLink}
              </div>
            </PopoverHeader>
            <CategoryMenuContent {...contentProps} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent
            side="left"
            className="w-full max-w-none p-0 sm:max-w-md"
          >
            <SheetHeader>
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="flex min-w-0 flex-col gap-1">
                  <SheetTitle>Categorias</SheetTitle>
                  <SheetDescription>
                    Selecione uma categoria principal ou um de seus níveis.
                  </SheetDescription>
                </div>
                {managerLink}
              </div>
            </SheetHeader>
            <CategoryMenuContent {...contentProps} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
