import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type AdminPaginationProps = {
  pathname: string;
  page: number;
  pageCount: number;
  searchParams: Record<string, string>;
};

function buildHref(
  pathname: string,
  searchParams: Record<string, string>,
  page: number
) {
  const params = new URLSearchParams(searchParams);
  params.set("page", String(page));
  return `${pathname}?${params.toString()}`;
}

function getVisiblePages(page: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  return Array.from(pages).filter((item) => item >= 1 && item <= pageCount).sort((a, b) => a - b);
}

export function AdminPagination({
  pathname,
  page,
  pageCount,
  searchParams,
}: AdminPaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(page, pageCount);

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          {page > 1 ? (
            <PaginationPrevious href={buildHref(pathname, searchParams, page - 1)} />
          ) : (
            <PaginationPrevious className="pointer-events-none opacity-50" href="#" />
          )}
        </PaginationItem>

        {visiblePages.map((visiblePage, index) => {
          const previous = visiblePages[index - 1];
          const shouldShowEllipsis = previous && visiblePage - previous > 1;

          return (
            <PaginationItem key={visiblePage}>
              {shouldShowEllipsis ? <PaginationEllipsis /> : null}
              <PaginationLink
                href={buildHref(pathname, searchParams, visiblePage)}
                isActive={visiblePage === page}
              >
                {visiblePage}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          {page < pageCount ? (
            <PaginationNext href={buildHref(pathname, searchParams, page + 1)} />
          ) : (
            <PaginationNext className="pointer-events-none opacity-50" href="#" />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
