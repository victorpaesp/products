import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "~/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductsPaginationProps } from "~/types/components";

export function ProductsPagination({
  page,
  perPage,
  data,
  searchParams,
  setSearchParams,
  className,
  top = false,
}: ProductsPaginationProps) {
  const total = data?.total ?? 0;
  const pageCount = total ? Math.ceil(total / perPage) : 1;
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, page + 2);
  const showingFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(total, page * perPage);

  const handlePageChange = (newPage: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", String(newPage));
    setSearchParams(newSearchParams);
  };

  const handlePerPageChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("per_page", value);
    newSearchParams.set("page", "1");
    setSearchParams(newSearchParams);
  };

  return (
    <div
      className={`flex w-full items-center justify-between gap-4 ${top ? "rounded-none border-b border-neutral-200 bg-transparent py-3" : "rounded-lg bg-white p-3"} ${className || ""}`}
    >
      {top ? (
        <>
          <div className="text-sm text-neutral-700">
            Mostrando {showingFrom}-{showingTo} de {total} resultados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => page > 1 && handlePageChange(page - 1)}
              disabled={page === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                {start > 1 && (
                  <PaginationItem key={1}>
                    <PaginationLink
                      href="#"
                      isActive={page === 1}
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();
                        handlePageChange(1);
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                )}
                {start > 2 && (
                  <PaginationItem key="start-ellipsis">
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {Array.from({ length: end - start + 1 }, (_, i) => {
                  const p = start + i;
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={page === p}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          handlePageChange(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {end < pageCount - 1 && (
                  <PaginationItem key="end-ellipsis">
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {end < pageCount && (
                  <PaginationItem key={pageCount}>
                    <PaginationLink
                      href="#"
                      isActive={page === pageCount}
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();
                        handlePageChange(pageCount);
                      }}
                    >
                      {pageCount}
                    </PaginationLink>
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => page < pageCount && handlePageChange(page + 1)}
              disabled={page === pageCount}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center">
            <PaginationPrevious
              href="#"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (page > 1) handlePageChange(page - 1);
              }}
              aria-disabled={page === 1}
            />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="hidden sm:block">
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  {start > 1 && (
                    <PaginationItem key={1}>
                      <PaginationLink
                        href="#"
                        isActive={page === 1}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          handlePageChange(1);
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  {start > 2 && (
                    <PaginationItem key="start-ellipsis">
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {Array.from({ length: end - start + 1 }, (_, i) => {
                    const p = start + i;
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={page === p}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            handlePageChange(p);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  {end < pageCount - 1 && (
                    <PaginationItem key="end-ellipsis">
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {end < pageCount && (
                    <PaginationItem key={pageCount}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageCount}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          handlePageChange(pageCount);
                        }}
                      >
                        {pageCount}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>

            <div className="flex items-center gap-2 text-sm text-neutral-700 sm:hidden">
              Página {page} de {pageCount}
            </div>

            <Select value={String(perPage)} onValueChange={handlePerPageChange}>
              <SelectTrigger id="per-page-select" className="w-20 sm:w-24">
                <SelectValue>{perPage}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">
            <PaginationNext
              href="#"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (page < pageCount) handlePageChange(page + 1);
              }}
              aria-disabled={page === pageCount}
            />
          </div>
        </>
      )}
    </div>
  );
}
