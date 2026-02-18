import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";


interface ProductsPaginationProps {
  page: number;
  perPage: number;
  data: { total: number } | null;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
  setData: (data: import("../types").ApiResponse | null) => void;
  className?: string;
}

export function ProductsPagination({
  page,
  perPage,
  data,
  searchParams,
  setSearchParams,
  setData,
  className,
}: ProductsPaginationProps) {
  const pageCount = data?.total ? Math.ceil(data.total / perPage) : 1;
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, page + 2);

  const handlePageChange = (newPage: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", String(newPage));
    setSearchParams(newSearchParams);
    setData(null);
  };

  const handlePerPageChange = (value: string) => {
    setData(null);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("per_page", value);
    newSearchParams.set("page", "1");
    setSearchParams(newSearchParams);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${className || ""}`}
    >
      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (page > 1) handlePageChange(page - 1);
              }}
              aria-disabled={page === 1}
            />
          </PaginationItem>
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
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (page < pageCount) handlePageChange(page + 1);
              }}
              aria-disabled={page === pageCount}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <div className="flex items-center gap-2">
        <label htmlFor="per-page-select" className="text-sm whitespace-nowrap">
          Itens por página:
        </label>
        <Select value={String(perPage)} onValueChange={handlePerPageChange}>
          <SelectTrigger id="per-page-select" className="w-20">
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
    </div>
  );
}
