"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

const WEEK_OPTIONS = Array.from({ length: 53 }, (_, i) => i + 1);

export function BdMonitoringFilters({
  weekFrom,
  weekTo,
  salesId,
  customerId,
  salesOptions,
  customerOptions,
}: {
  weekFrom?: string;
  weekTo?: string;
  salesId?: string;
  customerId?: string;
  salesOptions: { id: string; name: string }[];
  customerOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard/admin/bd-monitoring?${next.toString()}`);
  }

  const hasFilters = weekFrom || weekTo || salesId || customerId;

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4 sm:gap-4">
      <span className="flex w-full items-center gap-2 text-sm font-medium text-slate-700 sm:w-auto">
        <Filter className="h-4 w-4 shrink-0" />
        Filter
      </span>
      <div className="w-full min-w-0 sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">Week from</label>
        <select
          value={weekFrom ?? ""}
          onChange={(e) => updateFilter("week_from", e.target.value)}
          className="input-field w-full min-w-0 sm:min-w-[120px]"
        >
          <option value="">All</option>
          {WEEK_OPTIONS.map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full min-w-0 sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">Week to</label>
        <select
          value={weekTo ?? ""}
          onChange={(e) => updateFilter("week_to", e.target.value)}
          className="input-field w-full min-w-0 sm:min-w-[120px]"
        >
          <option value="">All</option>
          {WEEK_OPTIONS.map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full min-w-0 sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">Sales</label>
        <select
          value={salesId ?? ""}
          onChange={(e) => updateFilter("sales_id", e.target.value)}
          className="input-field w-full min-w-0 sm:min-w-[160px]"
        >
          <option value="">All</option>
          {salesOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full min-w-0 sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">Customer</label>
        <select
          value={customerId ?? ""}
          onChange={(e) => updateFilter("customer_id", e.target.value)}
          className="input-field w-full min-w-0 sm:min-w-[160px]"
        >
          <option value="">All</option>
          {customerOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/dashboard/admin/bd-monitoring")}
          className="btn-secondary text-sm"
        >
          Clear
        </button>
      )}
    </div>
  );
}
