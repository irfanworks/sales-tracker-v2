"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROSPECT_STATUSES } from "@/lib/types/database";
import { CircleDot, Filter, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SalesOption {
  id: string;
  display_name: string;
}

function FilterTile({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <label className="filter-tile">
      <span className="filter-tile__meta">
        <Icon aria-hidden />
        <span className="filter-tile__label">{label}</span>
      </span>
      {children}
    </label>
  );
}

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
    <section className="filter-panel" aria-label="Prospect filters">
      <div className="filter-panel__header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="filter-panel__icon">
            <Filter className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="filter-panel__title">
              Filters
              {hasFilters && <span className="filter-panel__count">{chips.length}</span>}
            </p>
            <p className="filter-panel__sub">
              {hasFilters ? "Active refinements applied" : "Refine open opportunities"}
            </p>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="btn-ghost gap-1.5 text-[12px] text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
            Reset all
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="filter-panel__chips">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="filter-chip"
              onClick={() => updateParam(chip.key, "")}
              title={`Remove ${chip.label}`}
            >
              <span className="opacity-70">{chip.label}</span>
              <span className="font-semibold text-cyan-900">{chip.value}</span>
              <X className="h-3 w-3 opacity-60" />
            </button>
          ))}
        </div>
      )}

      <div className="filter-panel__body">
        <p className="filter-section-label">Refine</p>
        <div className={`filter-tiles ${showSalesFilter ? "" : "filter-tiles--compact"}`}>
          <FilterTile label="Status" icon={CircleDot}>
            <select
              className="filter-tile__select"
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
          </FilterTile>
          {showSalesFilter && (
            <FilterTile label="Sales owner" icon={UserRound}>
              <select
                className="filter-tile__select"
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
            </FilterTile>
          )}
        </div>
      </div>
    </section>
  );
}
