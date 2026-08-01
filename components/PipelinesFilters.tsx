"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  OUTCOME_STATUSES,
  PROGRESS_TYPES,
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
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const selectClass =
  "input-field w-full appearance-none py-1.5 text-[13px] font-medium text-slate-800";

export function PipelinesFilters({
  progressType,
  prospect,
  outcomeStatus,
  salesId,
  sortBy,
  sortOrder,
  salesOptions,
  showSalesFilter = true,
  showProgressFilter = true,
  progressTypeOptions = PROGRESS_TYPES,
  basePath = "/dashboard",
}: {
  progressType?: string;
  prospect?: string;
  outcomeStatus?: string;
  salesId?: string;
  sortBy?: string;
  sortOrder?: string;
  salesOptions: SalesOption[];
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

  const salesLabel = salesId
    ? salesOptions.find((s) => s.id === salesId)?.display_name ?? "Sales"
    : null;

  const chips: { key: string; label: string; value: string }[] = [];
  if (showProgressFilter && progressType) {
    chips.push({ key: "progress_type", label: "Progress", value: progressType });
  }
  if (prospect) chips.push({ key: "prospect", label: "Prospect", value: prospect });
  if (outcomeStatus) chips.push({ key: "outcome_status", label: "Outcome", value: outcomeStatus });
  if (showSalesFilter && salesId && salesLabel) {
    chips.push({ key: "sales_id", label: "Sales", value: salesLabel });
  }
  if (sortBy && sortBy !== "date") {
    chips.push({
      key: "sort_by",
      label: "Sort",
      value: sortBy === "target_closing" ? "Target closing" : sortBy,
    });
  }
  if (sortOrder && sortOrder !== "desc") {
    chips.push({ key: "sort_order", label: "Order", value: "Ascending" });
  }

  const hasFilters = chips.length > 0;

  return (
    <div className="card-elevated overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/80 bg-slate-50 text-slate-600">
            <Filter className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[13px] font-semibold tracking-tight text-slate-800">Filters</p>
            <p className="text-[11px] text-slate-500">
              {hasFilters ? `${chips.length} active` : "Refine the list"}
            </p>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="btn-ghost gap-1 px-2 text-[12px] text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-slate-50/50 px-4 py-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="filter-chip"
              onClick={() => updateFilter(chip.key, "")}
              title={`Remove ${chip.label}`}
            >
              <span className="text-slate-400">{chip.label}:</span>
              {chip.value}
              <X className="h-3 w-3 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      <div
        className={`grid gap-3 p-3.5 sm:p-4 ${
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
