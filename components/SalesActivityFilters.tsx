"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays, startOfWeek } from "date-fns";
import { Filter, X } from "lucide-react";

interface SalesOption {
  id: string;
  display_name: string;
}

const selectClass =
  "input-field w-full appearance-none py-1.5 text-[13px] font-medium text-slate-800";

type Preset = "today" | "week" | "7d" | "14d" | "30d";

function presetRange(preset: Preset): { from: string; to: string } {
  const to = format(new Date(), "yyyy-MM-dd");
  if (preset === "today") return { from: to, to };
  if (preset === "week") {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return { from: format(weekStart, "yyyy-MM-dd"), to };
  }
  const days = preset === "7d" ? 6 : preset === "14d" ? 13 : 29;
  return { from: format(subDays(new Date(), days), "yyyy-MM-dd"), to };
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
  const today = format(new Date(), "yyyy-MM-dd");
  const weekFrom = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const activePreset: Preset | null =
    from === today && to === today
      ? "today"
      : from === weekFrom && to === today
        ? "week"
        : from === format(subDays(new Date(), 6), "yyyy-MM-dd") && to === today
          ? "7d"
          : from === format(subDays(new Date(), 13), "yyyy-MM-dd") && to === today
            ? "14d"
            : from === format(subDays(new Date(), 29), "yyyy-MM-dd") && to === today
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
    <div className="card-elevated overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/80 bg-slate-50 text-slate-600">
            <Filter className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[13px] font-semibold tracking-tight text-slate-800">
              Period for weekly review
            </p>
            <p className="text-[11px] text-slate-500">
              {hasFilters ? `${chips.length} active` : "Pick a range to scan activity"}
            </p>
          </div>
        </div>
        {hasFilters && (
          <button type="button" onClick={clearAll} className="btn-ghost gap-1 px-2 text-[12px] text-slate-600">
            <X className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-slate-50/50 px-4 py-2">
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
              <span className="text-slate-400">{chip.label}:</span>
              {chip.value}
              <X className="h-3 w-3 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3.5 p-3.5 sm:p-4">
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors duration-150 ${
                activePreset === p.id
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className={`grid gap-3 ${showSalesFilter ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              From
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
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              To
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
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Sales person
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
    </div>
  );
}
