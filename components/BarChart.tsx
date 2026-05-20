"use client";

export interface BarChartItem {
  label: string;
  value: number;
}

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
    return <p className="py-8 text-center text-sm text-slate-500">No data available.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-64 gap-3 border-b border-slate-200 pb-2 sm:h-72 sm:gap-4">
        {data.map((item) => {
          const heightPct = Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0);
          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-medium text-slate-600 sm:text-xs">{formatValue(item.value)}</span>
              <div className="flex w-full max-w-[56px] flex-1 items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${barClassName}`}
                  style={{ height: `${heightPct}%` }}
                  title={`${item.label}: ${formatValue(item.value)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 sm:gap-4">
        {data.map((item) => (
          <div key={item.label} className="min-w-0 flex-1 text-center">
            <p className="truncate text-[10px] font-medium text-slate-700 sm:text-xs" title={item.label}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
