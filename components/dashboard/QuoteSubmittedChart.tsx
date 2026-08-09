"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import type { DailyQuotePoint } from "@/lib/dashboard";

type DayRange = 7 | 14 | 30;

const CHART_W = 560;
const CHART_H = 260;

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
  series7d,
  series14d,
  series30d,
}: {
  series7d: DailyQuotePoint[];
  series14d: DailyQuotePoint[];
  series30d: DailyQuotePoint[];
}) {
  const [range, setRange] = useState<DayRange>(30);
  const [hovered, setHovered] = useState<string | null>(null);

  const data =
    range === 7 ? series7d ?? [] : range === 14 ? series14d ?? [] : series30d ?? [];

  const { maxCount, countTicks } = useMemo(() => {
    const raw = Math.max(...data.map((d) => d.count), 1);
    const mc = niceMax(raw);
    return { maxCount: mc, countTicks: ticks(mc, 4) };
  }, [data]);

  const padL = 36;
  const padR = 16;
  const padT = 24;
  const padB = 40;
  const innerW = CHART_W - padL - padR;
  const innerH = CHART_H - padT - padB;

  function xAt(i: number) {
    if (data.length <= 1) return padL + innerW / 2;
    return padL + (i / (data.length - 1)) * innerW;
  }

  function yAt(v: number) {
    return padT + innerH - (v / maxCount) * innerH;
  }

  const points = data.map((d, i) => ({ x: xAt(i), y: yAt(d.count) }));
  const path = smoothPath(points);
  const area =
    data.length > 0
      ? `${path} L ${xAt(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
      : "";

  const hoveredPoint = hovered ? data.find((d) => d.key === hovered) : null;
  const labelEvery = range === 30 ? 5 : range === 14 ? 2 : 1;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-300/80 bg-[#0f2744] text-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-cyan-300">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">Quote Submitted</h2>
            <p className="text-[11px] text-slate-300">Daily quote count</p>
          </div>
        </div>
        <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-3 pt-2 sm:px-3">
        {hoveredPoint && (
          <p className="mb-1 px-2 text-[11px] text-slate-300">
            {hoveredPoint.label}:{" "}
            <span className="font-semibold text-cyan-300">{hoveredPoint.count} quotes</span>
          </p>
        )}
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Daily quote submitted chart"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="quote-daily-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>

          {countTicks.map((t) => {
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
                  fill="#67e8f9"
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

          {area && <path d={area} fill="url(#quote-daily-fill)" />}
          <path
            d={path}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((d, i) => {
            const cx = xAt(i);
            const cy = yAt(d.count);
            const isHot = hovered === d.key;
            const showLabel = i % labelEvery === 0 || i === data.length - 1;

            return (
              <g
                key={d.key}
                onMouseEnter={() => setHovered(d.key)}
                onMouseLeave={() => setHovered(null)}
              >
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
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHot ? 5 : range <= 14 ? 3.5 : 2.5}
                  fill="#0f2744"
                  stroke="#22d3ee"
                  strokeWidth={2}
                />
                {showLabel && (
                  <text
                    x={cx}
                    y={CHART_H - 14}
                    textAnchor="middle"
                    fill={isHot ? "#ffffff" : "#94a3b8"}
                    style={{ fontSize: range === 30 ? 8 : 10, fontWeight: 700 }}
                  >
                    {d.dayLabel}
                  </text>
                )}
                <title>
                  {d.label}: {d.count} quotes
                </title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
