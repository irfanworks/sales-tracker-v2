"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";

interface SalesOption {
  id: string;
  display_name: string;
}

const selectClass =
  "input-field w-full appearance-none py-2 text-sm font-medium text-slate-800";

export function SalesActivityFilters({
  from,
  to,
  salesId,
  salesOptions,
  showSalesFilter = true,
}: {
  from?: string;
  to?: string;
  salesId?: string;
  salesOptions: SalesOption[];
  showSalesFilter?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function pushParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const qs = next.toString();
    router.push(qs ? `/dashboard/sales-activity?${qs}` : "/dashboard/sales-activity");
  }

  function clearAll() {
    router.push("/dashboard/sales-activity");
  }

  const hasFilters = Boolean(from || to || (showSalesFilter && salesId));

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
      <div
        className={`grid gap-4 ${showSalesFilter ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            From date
          </span>
          <input
            type="date"
            className={selectClass}
            value={from ?? ""}
            onChange={(e) =>
              pushParams((next) => {
                if (e.target.value) next.set("from", e.target.value);
                else next.delete("from");
              })
            }
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            To date
          </span>
          <input
            type="date"
            className={selectClass}
            value={to ?? ""}
            onChange={(e) =>
              pushParams((next) => {
                if (e.target.value) next.set("to", e.target.value);
                else next.delete("to");
              })
            }
          />
        </label>
        {showSalesFilter && (
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Sales
            </span>
            <select
              className={selectClass}
              value={salesId ?? ""}
              onChange={(e) =>
                pushParams((next) => {
                  if (e.target.value) next.set("sales_id", e.target.value);
                  else next.delete("sales_id");
                })
              }
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
