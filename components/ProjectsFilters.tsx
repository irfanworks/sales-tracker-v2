"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  OUTCOME_STATUSES,
  PROJECTS_LIST_PROGRESS_TYPES,
  PROSPECT_OPTIONS,
} from "@/lib/types/database";
import { Filter, X } from "lucide-react";

interface SalesOption {
  id: string;
  display_name: string;
}

function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const selectClass =
  "input-field w-full appearance-none py-2 text-sm font-medium text-slate-800";

export function ProjectsFilters({
  progressType,
  prospect,
  outcomeStatus,
  salesId,
  sortBy,
  sortOrder,
  salesOptions,
  showSalesFilter = true,
  showProgressFilter = true,
  progressTypeOptions = PROJECTS_LIST_PROGRESS_TYPES,
  basePath = "/dashboard",
}: {
  progressType?: string;
  prospect?: string;
  outcomeStatus?: string;
  salesId?: string;
  sortBy?: string;
  sortOrder?: string;
  salesOptions: SalesOption[];
  /** Only Admin can filter by Sales; Sales role sees only their own projects */
  showSalesFilter?: boolean;
  showProgressFilter?: boolean;
  progressTypeOptions?: readonly string[];
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.push(`${basePath}?${next.toString()}`);
  }

  const activeCount = [
    showProgressFilter && progressType,
    prospect,
    outcomeStatus,
    showSalesFilter && salesId,
    sortBy && sortBy !== "date" ? sortBy : null,
    sortOrder && sortOrder !== "desc" ? sortOrder : null,
  ].filter(Boolean).length;

  const hasFilters = activeCount > 0;

  return (
    <div className="card-elevated overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200/80">
            <Filter className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Filters</p>
            <p className="text-xs text-slate-500">
              {hasFilters ? `${activeCount} active` : "Refine the project list"}
            </p>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      <div
        className={`grid gap-3 p-4 sm:gap-4 sm:p-5 ${
          showProgressFilter && showSalesFilter
            ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
            : showSalesFilter || showProgressFilter
              ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
              : "sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {showProgressFilter && (
          <FilterField label="Progress">
            <select
              value={progressType ?? ""}
              onChange={(e) => updateFilter("progress_type", e.target.value)}
              className={selectClass}
            >
              <option value="">All</option>
              {progressTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FilterField>
        )}

        <FilterField label="Prospect">
          <select
            value={prospect ?? ""}
            onChange={(e) => updateFilter("prospect", e.target.value)}
            className={selectClass}
          >
            <option value="">All</option>
            {PROSPECT_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Outcome">
          <select
            value={outcomeStatus ?? ""}
            onChange={(e) => updateFilter("outcome_status", e.target.value)}
            className={selectClass}
          >
            <option value="">All</option>
            {OUTCOME_STATUSES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </FilterField>

        {showSalesFilter && (
          <FilterField label="Sales">
            <select
              value={salesId ?? ""}
              onChange={(e) => updateFilter("sales_id", e.target.value)}
              className={selectClass}
            >
              <option value="">All</option>
              {salesOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </FilterField>
        )}

        <FilterField label="Sort by">
          <select
            value={sortBy ?? "date"}
            onChange={(e) => updateFilter("sort_by", e.target.value)}
            className={selectClass}
          >
            <option value="date">Date</option>
            <option value="target_closing">Target closing</option>
          </select>
        </FilterField>

        <FilterField label="Order">
          <select
            value={sortOrder ?? "desc"}
            onChange={(e) => updateFilter("sort_order", e.target.value)}
            className={selectClass}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </FilterField>
      </div>
    </div>
  );
}
