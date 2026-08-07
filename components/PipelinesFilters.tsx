"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  OUTCOME_STATUSES,
  PROGRESS_TYPES,
  PROSPECT_OPTIONS,
} from "@/lib/types/database";
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  Filter,
  Flame,
  ListFilter,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
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
    const qs = next.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
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
    <section className="filter-panel" aria-label="Pipeline filters">
      <div className="filter-panel__header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="filter-panel__icon">
            <Filter className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="filter-panel__title">
              Filters
              {hasFilters && (
                <span className="filter-panel__count">{chips.length}</span>
              )}
            </p>
            <p className="filter-panel__sub">
              {hasFilters ? "Active refinements applied to this list" : "Refine pipelines with precision"}
            </p>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(basePath)}
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
              onClick={() => updateFilter(chip.key, "")}
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
        <div>
          <p className="filter-section-label">Refine</p>
          <div className="filter-tiles">
            {showProgressFilter && (
              <FilterTile label="Progress" icon={ListFilter}>
                <select
                  value={progressType ?? ""}
                  onChange={(e) => updateFilter("progress_type", e.target.value)}
                  className="filter-tile__select"
                >
                  <option value="">All progress</option>
                  {progressTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FilterTile>
            )}

            <FilterTile label="Prospect heat" icon={Flame}>
              <select
                value={prospect ?? ""}
                onChange={(e) => updateFilter("prospect", e.target.value)}
                className="filter-tile__select"
              >
                <option value="">All heats</option>
                {PROSPECT_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FilterTile>

            <FilterTile label="Outcome" icon={Trophy}>
              <select
                value={outcomeStatus ?? ""}
                onChange={(e) => updateFilter("outcome_status", e.target.value)}
                className="filter-tile__select"
              >
                <option value="">All outcomes</option>
                {OUTCOME_STATUSES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </FilterTile>

            {showSalesFilter && (
              <FilterTile label="Sales owner" icon={UserRound}>
                <select
                  value={salesId ?? ""}
                  onChange={(e) => updateFilter("sales_id", e.target.value)}
                  className="filter-tile__select"
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

        <div>
          <p className="filter-section-label">Sort</p>
          <div className="filter-tiles filter-tiles--sort">
            <FilterTile label="Sort by" icon={ArrowUpDown}>
              <select
                value={sortBy ?? "date"}
                onChange={(e) => updateFilter("sort_by", e.target.value)}
                className="filter-tile__select"
              >
                <option value="date">Date created</option>
                <option value="target_closing">Target closing</option>
              </select>
            </FilterTile>

            <FilterTile label="Order" icon={ArrowDownWideNarrow}>
              <select
                value={sortOrder ?? "desc"}
                onChange={(e) => updateFilter("sort_order", e.target.value)}
                className="filter-tile__select"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </FilterTile>
          </div>
        </div>
      </div>
    </section>
  );
}
