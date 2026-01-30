"use client";

const PROSPECT_STYLES: Record<string, string> = {
  "Hot Prospect": "bg-orange-100 text-orange-800 border-orange-200",
  Normal: "bg-slate-100 text-slate-700 border-slate-200",
};

const defaultStyle = "bg-slate-100 text-slate-600 border-slate-200";

export function ProspectBadge({ value }: { value: string }) {
  const style = PROSPECT_STYLES[value] ?? defaultStyle;
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${style}`}>
      {value}
    </span>
  );
}
