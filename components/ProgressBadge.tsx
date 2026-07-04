"use client";

const PROGRESS_STYLES: Record<string, string> = {
  Budgetary: "bg-amber-100 text-amber-800 border-amber-200",
  Tender: "bg-blue-100 text-blue-800 border-blue-200",
  BD: "bg-violet-100 text-violet-800 border-violet-200",
};

const defaultStyle = "bg-slate-100 text-slate-700 border-slate-200";

export function ProgressBadge({ value }: { value: string }) {
  const style = PROGRESS_STYLES[value] ?? defaultStyle;
  return (
    <span className={`badge border ${style}`}>{value}</span>
  );
}
