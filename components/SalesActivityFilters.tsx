"use client";

import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, ChevronDown, Filter, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  daysAgoJakarta,
  jakartaTodayKey,
  startOfWeekJakarta,
} from "@/lib/timezone";

interface SalesOption {
  id: string;
  display_name: string;
}

type Preset = "today" | "week" | "7d" | "14d" | "30d";

function presetRange(preset: Preset): { from: string; to: string } {
  const to = jakartaTodayKey();
  if (preset === "today") return { from: to, to };
  if (preset === "week") return { from: startOfWeekJakarta(to), to };
  const days = preset === "7d" ? 6 : preset === "14d" ? 13 : 29;
  return { from: daysAgoJakarta(days, to), to };
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
  const [expanded, setExpanded] = useState(false);

  function pushParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const qs = next.toString();
    router.push(qs ? `/dashboard/sales-activity?${qs}` : "/dashboard/sales-activity");
  }

  function applyPreset(preset: Preset) {
    const range = presetRange(preset);
    pushParams((next) => {
      next.set("from", range.from);
      next.set("to", range.to);
    });
  }

  function clearAll() {
    router.push("/dashboard/sales-activity");
  }

  const hasFilters = Boolean(from || to || (showSalesFilter && salesId));
  const today = jakartaTodayKey();
  const weekFrom = startOfWeekJakarta(today);

  const activePreset: Preset | null =
    from === today && to === today
      ? "today"
      : from === weekFrom && to === today
        ? "week"
        : from === daysAgoJakarta(6, today) && to === today
          ? "7d"
          : from === daysAgoJakarta(13, today) && to === today
            ? "14d"
            : from === daysAgoJakarta(29, today) && to === today
              ? "30d"
              : null;

  const presets: { id: Preset; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "This week" },
    { id: "7d", label: "7 days" },
    { id: "14d", label: "14 days" },
    { id: "30d", label: "30 days" },
  ];

  const salesLabel = salesId
    ? salesOptions.find((s) => s.id === salesId)?.display_name ?? "Sales"
    : null;

  const chips: { key: string; label: string; value: string }[] = [];
  if (from || to) {
    chips.push({
      key: "range",
      label: "Period",
      value: `${from ?? "…"} → ${to ?? "…"}`,
    });
  }
  if (showSalesFilter && salesId && salesLabel) {
    chips.push({ key: "sales_id", label: "Sales", value: salesLabel });
  }

  return (
    <section className="filter-panel" aria-label="Sales activity filters">
      <div className="filter-panel__header">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left md:pointer-events-none"
          aria-expanded={expanded}
        >
          <span className="filter-panel__icon">
            <Filter className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="filter-panel__title">
              Period for weekly review
              {hasFilters && (
                <span className="filter-panel__count">{chips.length}</span>
              )}
            </p>
            <p className="filter-panel__sub">
              {hasFilters
                ? "Active refinements applied · GMT+7"
                : "Pick a range in GMT+7 (WIB)"}
            </p>
          </div>
          <ChevronDown
            className={`ml-auto h-5 w-5 shrink-0 text-slate-400 transition-transform md:hidden ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
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

      {chips.length > 0 && (
        <div className="filter-panel__chips">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="filter-chip"
              onClick={() => {
                if (chip.key === "range") {
                  pushParams((next) => {
                    next.delete("from");
                    next.delete("to");
                  });
                } else {
                  pushParams((next) => next.delete(chip.key));
                }
              }}
              title={`Remove ${chip.label}`}
            >
              <span className="opacity-70">{chip.label}</span>
              <span className="font-semibold text-cyan-900">{chip.value}</span>
              <X className="h-3 w-3 opacity-60" />
            </button>
          ))}
        </div>
      )}

      <div className={`filter-panel__body ${expanded ? "" : "hidden md:block"}`}>
        <div>
          <p className="filter-section-label">Quick range · GMT+7</p>
          <div className="filter-presets">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`filter-preset${activePreset === p.id ? " is-active" : ""}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="filter-section-label">Custom</p>
          <div className="filter-tiles filter-tiles--compact">
            <FilterTile label="From" icon={CalendarRange}>
              <input
                type="date"
                className="filter-tile__input"
                value={from ?? ""}
                onChange={(e) =>
                  pushParams((next) => {
                    if (e.target.value) next.set("from", e.target.value);
                    else next.delete("from");
                  })
                }
              />
            </FilterTile>
            <FilterTile label="To" icon={CalendarRange}>
              <input
                type="date"
                className="filter-tile__input"
                value={to ?? ""}
                onChange={(e) =>
                  pushParams((next) => {
                    if (e.target.value) next.set("to", e.target.value);
                    else next.delete("to");
                  })
                }
              />
            </FilterTile>
            {showSalesFilter && (
              <FilterTile label="Sales owner" icon={UserRound}>
                <select
                  className="filter-tile__select"
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
              </FilterTile>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
