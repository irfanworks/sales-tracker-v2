import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProjectsPagination({
  page,
  totalCount,
  pageSize,
  basePath,
  searchParams,
}: {
  page: number;
  totalCount: number;
  pageSize: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalCount <= pageSize) return null;

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") params.set(key, value);
    });
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing {from}–{to} of {totalCount} projects
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={buildHref(page - 1)} className="btn-secondary gap-1 text-sm">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : (
          <span className="btn-secondary pointer-events-none gap-1 text-sm opacity-50">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </span>
        )}
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={buildHref(page + 1)} className="btn-secondary gap-1 text-sm">
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="btn-secondary pointer-events-none gap-1 text-sm opacity-50">
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
