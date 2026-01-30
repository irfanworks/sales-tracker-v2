"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROGRESS_TYPES, PROSPECT_OPTIONS } from "@/lib/types/database";
import { Filter } from "lucide-react";

interface SalesOption {
  id: string;
  display_name: string;
}

export function ProjectsFilters({
  progressType,
  prospect,
  salesId,
  salesOptions,
}: {
  progressType?: string;
  prospect?: string;
  salesId?: string;
  salesOptions: SalesOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard?${next.toString()}`);
  }

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4 sm:gap-4">
      <span className="flex w-full items-center gap-2 text-sm font-medium text-slate-700 sm:w-auto">
        <Filter className="h-4 w-4 shrink-0" />
        Filters
      </span>
      <div className="w-full min-w-0 sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Progress Type
        </label>
        <select
          value={progressType ?? ""}
          onChange={(e) => updateFilter("progress_type", e.target.value)}
          className="input-field w-full min-w-0 sm:min-w-[140px]"
        >
          <option value="">All</option>
          {PROGRESS_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Prospect
        </label>
        <select
          value={prospect ?? ""}
          onChange={(e) => updateFilter("prospect", e.target.value)}
          className="input-field w-full min-w-0 sm:min-w-[140px]"
        >
          <option value="">All</option>
          {PROSPECT_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full min-w-0 sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Sales
        </label>
        <select
          value={salesId ?? ""}
          onChange={(e) => updateFilter("sales_id", e.target.value)}
          className="input-field w-full min-w-0 sm:min-w-[160px]"
        >
          <option value="">All</option>
          {salesOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
      </div>
      {(progressType || prospect || salesId) && (
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="btn-secondary text-sm"
        >
          Clear
        </button>
      )}
    </div>
  );
}
