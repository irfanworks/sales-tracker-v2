"use client";

const PROGRESS_STYLES: Record<string, string> = {
  Budgetary: "bg-amber-100 text-amber-800 border-amber-200",
  Tender: "bg-blue-100 text-blue-800 border-blue-200",
  Win: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Lose: "bg-red-100 text-red-800 border-red-200",
};

const defaultStyle = "bg-slate-100 text-slate-700 border-slate-200";

export function ProgressBadge({ value }: { value: string }) {
  const style = PROGRESS_STYLES[value] ?? defaultStyle;
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${style}`}>
      {value}
    </span>
  );
}
