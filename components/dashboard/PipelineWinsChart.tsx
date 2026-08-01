"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import type { MonthlyWinPoint } from "@/lib/dashboard";
import { useCurrencyScope, type Currency } from "@/components/ui/CurrencyToggle";

const CHART_W = 560;
const CHART_H = 280;

function niceMax(n: number) {
  if (n <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const m = n / exp;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nice * exp;
}

function ticks(max: number, count = 4) {
  const top = niceMax(max);
  const step = top / count;
  return Array.from({ length: count + 1 }, (_, i) => Number((i * step).toFixed(6)));
}

/** Compact currency for chart labels — readable in meetings. */
function formatWinValue(valueInIdr: number, currency: Currency, convert: (n: number) => number) {
  const n = convert(valueInIdr);
  const abs = Math.abs(n);
  const prefix = currency === "IDR" ? "" : currency === "USD" ? "$" : "S$";
  if (abs >= 1_000_000_000_000) return `${prefix}${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (abs >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
  return `${prefix}${Math.round(n)}`;
}

export function PipelineWinsChart({
  series,
  year,
}: {
  series: MonthlyWinPoint[];
  year: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const currencyScope = useCurrencyScope();
  const currency = currencyScope?.currency ?? "IDR";
  const convert =
    currencyScope?.convert ??
    ((n: number) => n);
  const formatFull =
    currencyScope?.format ??
    ((n: number) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(n));

  const { maxWins, winTicks } = useMemo(() => {
    const raw = Math.max(...series.map((d) => d.wins), 1);
    const mw = niceMax(raw);
    return { maxWins: mw, winTicks: ticks(mw, 4) };
  }, [series]);

  const padL = 36;
  const padR = 16;
  const padT = 36;
  const padB = 40;
  const innerW = CHART_W - padL - padR;
  const innerH = CHART_H - padT - padB;
  const barGap = 0.35;
  const slot = innerW / series.length;
  const barW = slot * (1 - barGap);

  function xCenter(i: number) {
    return padL + i * slot + slot / 2;
  }

  function yAt(v: number) {
    return padT + innerH - (v / maxWins) * innerH;
  }

  const hoveredPoint = hovered ? series.find((d) => d.key === hovered) : null;
  const totalWins = series.reduce((s, d) => s + d.wins, 0);
  const totalValue = series.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-300/80 bg-[#0f2744] text-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-orange-300">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">Pipeline Wins</h2>
            <p className="text-[11px] text-slate-300">
              Monthly wins · {year} ({totalWins} · {formatWinValue(totalValue, currency, convert)})
            </p>
          </div>
        </div>
        {hoveredPoint && (
          <p className="text-[11px] text-slate-300">
            {hoveredPoint.fullLabel}:{" "}
            <span className="font-semibold text-orange-300">
              {hoveredPoint.wins} wins · {formatFull(hoveredPoint.value)}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-3 pt-2 sm:px-3">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Pipeline wins by month for ${year}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {winTicks.map((t) => {
            const y = yAt(t);
            return (
              <g key={`g-${t}`}>
                <line
                  x1={padL}
                  x2={CHART_W - padR}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth={1}
                />
                <text
                  x={padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#fdba74"
                  style={{ fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                >
                  {Math.round(t)}
                </text>
              </g>
            );
          })}

          <line
            x1={padL}
            x2={CHART_W - padR}
            y1={padT + innerH}
            y2={padT + innerH}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1.25}
          />

          {series.map((d, i) => {
            const cx = xCenter(i);
            const barH = Math.max((d.wins / maxWins) * innerH, d.wins > 0 ? 3 : 0);
            const y = padT + innerH - barH;
            const isHot = hovered === d.key;
            const currentMonth = new Date().getMonth() === i && year === new Date().getFullYear();
            const valueLabel = formatWinValue(d.value, currency, convert);

            return (
              <g
                key={d.key}
                onMouseEnter={() => setHovered(d.key)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default" }}
              >
                <rect
                  x={cx - barW / 2}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill={isHot || currentMonth ? "#fb923c" : "#f97316"}
                  opacity={isHot ? 1 : currentMonth ? 0.95 : 0.75}
                />
                {d.wins > 0 && (
                  <>
                    <text
                      x={cx}
                      y={y - 16}
                      textAnchor="middle"
                      fill="#fed7aa"
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {valueLabel}
                    </text>
                    <text
                      x={cx}
                      y={y - 5}
                      textAnchor="middle"
                      fill="#fdba74"
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        opacity: 0.85,
                      }}
                    >
                      {d.wins} win{d.wins === 1 ? "" : "s"}
                    </text>
                  </>
                )}
                <text
                  x={cx}
                  y={CHART_H - 14}
                  textAnchor="middle"
                  fill={isHot || currentMonth ? "#ffffff" : "#94a3b8"}
                  style={{ fontSize: 10, fontWeight: 700 }}
                >
                  {d.label}
                </text>
                <title>
                  {d.fullLabel}: {d.wins} wins · {formatFull(d.value)}
                </title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
