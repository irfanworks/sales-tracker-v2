"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROSPECT_STATUSES } from "@/lib/types/database";
import { Filter, X } from "lucide-react";

interface SalesOption {
  id: string;
  display_name: string;
}

const selectClass =
  "input-field w-full appearance-none py-2 text-sm font-medium text-slate-800";

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

  const hasFilters = Boolean(status || (showSalesFilter && salesId));

  return (
    <div className="card-elevated space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="h-4 w-4 text-slate-400" />
          Filters
        </p>
        {hasFilters && (
          <button type="button" onClick={clearAll} className="btn-ghost gap-1.5 px-2 text-xs text-slate-600">
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
      <div className={`grid gap-4 ${showSalesFilter ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
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
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
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
