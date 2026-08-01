"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROSPECT_STATUSES } from "@/lib/types/database";
import { Filter, X } from "lucide-react";

interface SalesOption {
  id: string;
  display_name: string;
}

const selectClass =
  "input-field w-full appearance-none py-1.5 text-[13px] font-medium text-slate-800";

export function ProspectsFilters({
  status,
  salesId,
  salesOptions,
  showSalesFilter = true,
}: {
  status?: string;
  salesId?: string;
  salesOptions: SalesOption[];
  showSalesFilter?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/dashboard/prospects?${qs}` : "/dashboard/prospects");
  }

  function clearAll() {
    router.push("/dashboard/prospects");
  }

  const salesLabel = salesId
    ? salesOptions.find((s) => s.id === salesId)?.display_name ?? "Sales"
    : null;

  const chips: { key: string; label: string; value: string }[] = [];
  if (status) chips.push({ key: "status", label: "Status", value: status });
  if (showSalesFilter && salesId && salesLabel) {
    chips.push({ key: "sales_id", label: "Sales", value: salesLabel });
  }

  const hasFilters = chips.length > 0;

  return (
    <div className="card-elevated overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/80 bg-slate-50 text-slate-600">
            <Filter className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[13px] font-semibold tracking-tight text-slate-800">Filters</p>
            <p className="text-[11px] text-slate-500">
              {hasFilters ? `${chips.length} active` : "Refine prospects"}
            </p>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
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
              onClick={() => updateParam(chip.key, "")}
              title={`Remove ${chip.label}`}
            >
              <span className="text-slate-400">{chip.label}:</span>
              {chip.value}
              <X className="h-3 w-3 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      <div className={`grid gap-3 p-3.5 sm:p-4 ${showSalesFilter ? "sm:grid-cols-2" : ""}`}>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Status
          </span>
          <select
            className={selectClass}
            value={status ?? ""}
            onChange={(e) => updateParam("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {PROSPECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {showSalesFilter && (
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Sales
            </span>
            <select
              className={selectClass}
              value={salesId ?? ""}
              onChange={(e) => updateParam("sales_id", e.target.value)}
            >
              <option value="">All sales</option>
              {salesOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
