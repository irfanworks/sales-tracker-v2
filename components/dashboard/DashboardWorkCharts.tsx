"use client";

import { useMemo, useState } from "react";
import type { BreakdownPoint } from "@/lib/dashboard";

const PALETTE = [
  { from: "#22d3ee", to: "#0891b2", soft: "rgba(34,211,238,0.15)" },
  { from: "#fb923c", to: "#ea580c", soft: "rgba(251,146,60,0.15)" },
  { from: "#a78bfa", to: "#7c3aed", soft: "rgba(167,139,250,0.15)" },
  { from: "#34d399", to: "#059669", soft: "rgba(52,211,153,0.15)" },
  { from: "#f472b6", to: "#db2777", soft: "rgba(244,114,182,0.15)" },
  { from: "#94a3b8", to: "#64748b", soft: "rgba(148,163,184,0.15)" },
];

function formatIdrShort(n: number) {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

function DonutRing({
  data,
  size = 168,
}: {
  data: BreakdownPoint[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      {data.map((d, i) => {
        if (d.count <= 0) return null;
        const len = (d.count / total) * c;
        const dash = `${len} ${c - len}`;
        const el = (
          <circle
            key={d.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#grad-${i})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            className="transition-all duration-700 ease-out"
          />
        );
        offset += len;
        return el;
      })}
      <defs>
        {PALETTE.map((p, i) => (
          <linearGradient key={i} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.from} />
            <stop offset="100%" stopColor={p.to} />
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
}

function BreakdownChartPanel({
  title,
  subtitle,
  data,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  data: BreakdownPoint[];
  emptyLabel: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const hasData = data.some((d) => d.count > 0);
  const totalCount = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);
  const totalValue = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const active = data.find((d) => d.label === hover) ?? null;

  return (
    <div className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-slate-300/80 bg-[#0f2744] text-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white sm:text-sm">
            {title}
          </h2>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        {hasData && (
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
            <p className="text-lg font-bold tabular-nums text-white">{totalCount}</p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        {!hasData ? (
          <p className="w-full py-16 text-center text-sm text-slate-400">{emptyLabel}</p>
        ) : (
          <>
            <div className="relative mx-auto shrink-0">
              <DonutRing data={data} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {active ? active.label : "Pipeline"}
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-white">
                  {active ? active.count : totalCount}
                </p>
                <p className="text-[10px] text-slate-400">
                  IDR {formatIdrShort(active ? active.value : totalValue)}
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              {data.map((d, i) => {
                const color = PALETTE[i % PALETTE.length];
                const pct = totalCount > 0 ? (d.count / totalCount) * 100 : 0;
                const valuePct = (d.value / maxValue) * 100;
                const isActive = hover === d.label || hover == null;

                return (
                  <button
                    key={d.label}
                    type="button"
                    onMouseEnter={() => setHover(d.label)}
                    onMouseLeave={() => setHover(null)}
                    className={`w-full rounded-xl border border-white/5 px-3 py-2.5 text-left transition-all duration-200 ${
                      isActive ? "bg-white/5" : "opacity-45"
                    }`}
                    style={{ backgroundColor: hover === d.label ? color.soft : undefined }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                        />
                        <span className="truncate text-xs font-semibold text-slate-100">{d.label}</span>
                      </div>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-white">
                        {d.count} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(valuePct, d.value > 0 ? 4 : 0)}%`,
                          background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Value IDR {formatIdrShort(d.value)}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function DashboardWorkCharts({
  byCategory,
  bySector,
}: {
  byCategory: BreakdownPoint[];
  bySector: BreakdownPoint[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      <BreakdownChartPanel
        title="Work by Category"
        subtitle="Share of work by project type"
        data={byCategory}
        emptyLabel="No projects to chart yet."
      />
      <BreakdownChartPanel
        title="Work by Sector"
        subtitle="Share of work by customer sector"
        data={bySector}
        emptyLabel="No sector data yet."
      />
    </div>
  );
}
