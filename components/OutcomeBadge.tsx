const OUTCOME_STYLES: Record<string, string> = {
  Win: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Lose: "bg-red-100 text-red-800 border-red-200",
  "On Hold": "bg-amber-100 text-amber-800 border-amber-200",
};

export function OutcomeBadge({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="text-slate-400">—</span>;
  }

  const style = OUTCOME_STYLES[value] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`badge border ${style}`}>{value}</span>
  );
}
