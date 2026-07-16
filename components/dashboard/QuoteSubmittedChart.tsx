"use client";

import { useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import type { MonthlyQuotePoint } from "@/lib/dashboard";
import { useCurrencyFormatter, type Currency } from "@/components/ui/CurrencyToggle";

type Range = 3 | 12;

function niceMax(n: number) {
  if (n <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const m = n / exp;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nice * exp;
}

function formatAxisValue(n: number, currency: Currency) {
  const abs = Math.abs(n);
  const prefix = currency === "IDR" ? "" : currency === "USD" ? "$" : "S$";
  if (abs >= 1_000_000_000_000) return `${prefix}${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (abs >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
  return `${prefix}${Math.round(n)}`;
}

function ticks(max: number, count = 4) {
  const top = niceMax(max);
  const step = top / count;
  return Array.from({ length: count + 1 }, (_, i) => Number((i * step).toFixed(6)));
}

/** Catmull-Rom → cubic Bézier so lines flow smoothly through each point. */
function smoothPath(points: Array<{ x: number; y: number }>, tension = 1): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function QuoteSubmittedChart({
  series3m,
  series12m,
  usdPerIdr,
  sgdPerIdr,
  currency: controlledCurrency,
  fillHeight = false,
}: {
  series3m: MonthlyQuotePoint[];
  series12m: MonthlyQuotePoint[];
  usdPerIdr: number;
  sgdPerIdr: number;
  currency?: Currency;
  fillHeight?: boolean;
}) {
  const [range, setRange] = useState<Range>(12);
  const [localCurrency, setLocalCurrency] = useState<Currency>("IDR");
  const [hovered, setHovered] = useState<string | null>(null);
  const currency = controlledCurrency ?? localCurrency;
  const formatCurrency = useCurrencyFormatter(currency);

  const data = range === 3 ? series3m : series12m;

  const toCurrency = (valueInIdr: number) => {
    if (currency === "USD") return valueInIdr * usdPerIdr;
    if (currency === "SGD") return valueInIdr * sgdPerIdr;
    return valueInIdr;
  };

  const { maxCount, maxValue, countTicks, valueTicks } = useMemo(() => {
    const rawCount = Math.max(...data.map((d) => d.count), 1);
    const rawValue = Math.max(...data.map((d) => toCurrency(d.value)), 1);
    const mc = niceMax(rawCount);
    const mv = niceMax(rawValue);
    return {
      maxCount: mc,
      maxValue: mv,
      countTicks: ticks(mc, 4),
      valueTicks: ticks(mv, 4),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, currency, usdPerIdr, sgdPerIdr]);

  const chartH = fillHeight ? 300 : 240;
  const padL = 44;
  const padR = 52;
  const padT = 28;
  const padB = 44;
  const pointGap = range === 3 ? 110 : 72;
  const w = Math.max(360, padL + padR + Math.max(data.length - 1, 1) * pointGap);
  const innerW = w - padL - padR;
  const innerH = chartH - padT - padB;

  function xAt(i: number) {
    if (data.length <= 1) return padL + innerW / 2;
    return padL + (i / (data.length - 1)) * innerW;
  }

  function yCount(v: number) {
    return padT + innerH - (v / maxCount) * innerH;
  }

  function yValue(v: number) {
    return padT + innerH - (toCurrency(v) / maxValue) * innerH;
  }

  const countPoints = data.map((d, i) => ({ x: xAt(i), y: yCount(d.count) }));
  const valuePoints = data.map((d, i) => ({ x: xAt(i), y: yValue(d.value) }));
  const countPath = smoothPath(countPoints);
  const valuePath = smoothPath(valuePoints);

  const countArea =
    data.length > 0
      ? `${countPath} L ${xAt(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
      : "";

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-300/80 bg-[#0f2744] text-white shadow-sm ${
        fillHeight ? "flex h-full min-h-[380px] flex-col" : ""
      }`}
    >
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-cyan-300">
            <LineChart className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white">Quote Submitted</h2>
            <p className="text-xs text-slate-300">Monthly quote count & total value</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
            {([3, 12] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                Last {r}m
              </button>
            ))}
          </div>
          {controlledCurrency == null && (
            <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
              {(["IDR", "USD", "SGD"] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setLocalCurrency(cur)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    currency === cur ? "bg-white text-slate-900 shadow-sm" : "text-slate-300"
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`px-2 pb-4 pt-3 sm:px-4 ${fillHeight ? "flex flex-1 flex-col" : ""}`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3 px-2 text-xs font-medium">
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2 text-cyan-300">
              <span className="h-0.5 w-5 rounded bg-cyan-400" /> Count
            </span>
            <span className="inline-flex items-center gap-2 text-orange-300">
              <span
                className="h-0.5 w-5 rounded bg-orange-400"
                style={{ borderTop: "2px dashed #fb923c", height: 0 }}
              />{" "}
              Value
            </span>
          </div>
          {hovered && (
            <p className="text-[11px] text-slate-300">
              {data.find((d) => d.key === hovered)?.label}:{" "}
              <span className="font-semibold text-cyan-300">
                {data.find((d) => d.key === hovered)?.count ?? 0} quotes
              </span>
              {" · "}
              <span className="font-semibold text-orange-300">
                {formatCurrency(toCurrency(data.find((d) => d.key === hovered)?.value ?? 0))}
              </span>
            </p>
          )}
        </div>

        <div className={`overflow-x-auto scrollbar-thin ${fillHeight ? "flex-1" : ""}`}>
          <svg
            viewBox={`0 0 ${w} ${chartH}`}
            className="min-w-full"
            style={{ height: chartH, minWidth: w }}
            role="img"
            aria-label="Quote submitted dual line chart with numbered axes"
          >
            <defs>
              <linearGradient id="count-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid + left Y (count) + right Y (value) */}
            {countTicks.map((t) => {
              const y = yCount(t);
              return (
                <g key={`grid-${t}`}>
                  <line
                    x1={padL}
                    x2={w - padR}
                    y1={y}
                    y2={y}
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth={1}
                  />
                  <text
                    x={padL - 10}
                    y={y + 3}
                    textAnchor="end"
                    fill="#67e8f9"
                    style={{ fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                  >
                    {Math.round(t)}
                  </text>
                  <text
                    x={w - padR + 10}
                    y={y + 3}
                    textAnchor="start"
                    fill="#fdba74"
                    style={{ fontSize: 9, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatAxisValue(t === 0 ? 0 : (t / maxCount) * maxValue, currency)}
                  </text>
                </g>
              );
            })}

            {/* Axis lines */}
            <line
              x1={padL}
              x2={padL}
              y1={padT}
              y2={padT + innerH}
              stroke="rgba(103,232,249,0.35)"
              strokeWidth={1.25}
            />
            <line
              x1={w - padR}
              x2={w - padR}
              y1={padT}
              y2={padT + innerH}
              stroke="rgba(253,186,116,0.35)"
              strokeWidth={1.25}
            />
            <line
              x1={padL}
              x2={w - padR}
              y1={padT + innerH}
              y2={padT + innerH}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1.25}
            />

            {/* Axis titles */}
            <text
              x={14}
              y={padT + innerH / 2}
              fill="#67e8f9"
              textAnchor="middle"
              transform={`rotate(-90, 14, ${padT + innerH / 2})`}
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em" }}
            >
              COUNT
            </text>
            <text
              x={w - 12}
              y={padT + innerH / 2}
              fill="#fdba74"
              textAnchor="middle"
              transform={`rotate(90, ${w - 12}, ${padT + innerH / 2})`}
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em" }}
            >
              VALUE
            </text>

            {countArea && <path d={countArea} fill="url(#count-fill)" />}

            <path
              d={valuePath}
              fill="none"
              stroke="#fb923c"
              strokeWidth={2.5}
              strokeDasharray="7 5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={countPath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {data.map((d, i) => {
              const cx = xAt(i);
              const cyC = yCount(d.count);
              const cyV = yValue(d.value);
              const isHot = hovered === d.key;
              const showValueLabel = range === 3 || isHot || d.value > 0;

              return (
                <g
                  key={d.key}
                  onMouseEnter={() => setHovered(d.key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "default" }}
                >
                  {/* Vertical guide on hover / always subtle tick */}
                  <line
                    x1={cx}
                    x2={cx}
                    y1={padT + innerH}
                    y2={padT + innerH + 6}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={1}
                  />
                  {isHot && (
                    <line
                      x1={cx}
                      x2={cx}
                      y1={padT}
                      y2={padT + innerH}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth={1}
                      strokeDasharray="3 4"
                    />
                  )}

                  {/* Count point + X-aligned number */}
                  <circle
                    cx={cx}
                    cy={cyC}
                    r={isHot ? 5.5 : 4.5}
                    fill="#0f2744"
                    stroke="#22d3ee"
                    strokeWidth={2.25}
                  />
                  <text
                    x={cx}
                    y={cyC - 10}
                    textAnchor="middle"
                    fill="#a5f3fc"
                    style={{
                      fontSize: range === 3 ? 11 : 10,
                      fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {d.count}
                  </text>

                  {/* Value point + compact value near X column */}
                  <circle
                    cx={cx}
                    cy={cyV}
                    r={isHot ? 5 : 4}
                    fill="#0f2744"
                    stroke="#fb923c"
                    strokeWidth={2}
                  />
                  {showValueLabel && (
                    <text
                      x={cx}
                      y={Math.min(cyV + 14, padT + innerH - 4)}
                      textAnchor="middle"
                      fill="#fdba74"
                      style={{
                        fontSize: range === 3 ? 9 : 8,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        opacity: range === 12 && !isHot ? 0.75 : 1,
                      }}
                    >
                      {formatAxisValue(toCurrency(d.value), currency)}
                    </text>
                  )}

                  {/* X-axis month label */}
                  <text
                    x={cx}
                    y={chartH - 16}
                    textAnchor="middle"
                    fill={isHot ? "#ffffff" : "#cbd5e1"}
                    style={{ fontSize: range === 3 ? 11 : 10, fontWeight: 700 }}
                  >
                    {d.label}
                  </text>

                  <title>
                    {d.label}: {d.count} quotes · {formatCurrency(toCurrency(d.value))}
                  </title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
