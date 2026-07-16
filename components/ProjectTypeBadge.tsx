const TYPE_STYLES: Record<string, string> = {
  Project: "bg-slate-100 text-slate-700 border-slate-200",
  Trading: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Service: "bg-teal-100 text-teal-800 border-teal-200",
};

export function ProjectTypeBadge({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="text-slate-400">—</span>;
  }

  const style = TYPE_STYLES[value] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`badge border ${style}`}>{value}</span>
  );
}
