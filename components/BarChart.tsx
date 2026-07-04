"use client";

export interface BarChartItem {
  label: string;
  value: number;
}

const barGradients: Record<string, string> = {
  "bg-cyan-600": "from-cyan-400 to-cyan-600",
  "bg-emerald-600": "from-emerald-400 to-emerald-600",
  "bg-amber-500": "from-amber-400 to-amber-500",
};

export function BarChart({
  data,
  formatValue,
  barClassName = "bg-cyan-600",
}: {
  data: BarChartItem[];
  formatValue: (value: number) => string;
  barClassName?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
        <p className="text-sm text-slate-500">No data available yet.</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const gradient = barGradients[barClassName] ?? "from-cyan-400 to-cyan-600";

  return (
    <div className="space-y-4">
      <div className="flex h-56 gap-2 border-b border-slate-100 pb-3 sm:h-64 sm:gap-3 md:gap-4">
        {data.map((item, index) => {
          const heightPct = Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0);
          return (
            <div
              key={`${item.label}-${index}`}
              className="group flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <span className="text-[10px] font-semibold tabular-nums text-slate-500 transition group-hover:text-slate-700 sm:text-xs">
                {formatValue(item.value)}
              </span>
              <div className="flex w-full max-w-[48px] flex-1 items-end sm:max-w-[56px]">
                <div
                  className={`w-full rounded-t-lg bg-gradient-to-t ${gradient} shadow-sm transition-all duration-300 group-hover:shadow-md`}
                  style={{ height: `${heightPct}%` }}
                  title={`${item.label}: ${formatValue(item.value)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 sm:gap-3 md:gap-4">
        {data.map((item, index) => (
          <div key={`${item.label}-${index}`} className="min-w-0 flex-1 text-center">
            <p
              className="truncate text-[10px] font-medium text-slate-600 sm:text-xs"
              title={item.label}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
