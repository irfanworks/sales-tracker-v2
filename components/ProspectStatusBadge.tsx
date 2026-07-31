const STATUS_STYLES: Record<string, string> = {
  Open: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Closed: "bg-slate-100 text-slate-700 border-slate-200",
  Converted: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

const defaultStyle = "bg-slate-100 text-slate-700 border-slate-200";

export function ProspectStatusBadge({ value }: { value: string }) {
  const style = STATUS_STYLES[value] ?? defaultStyle;
  return <span className={`badge border ${style}`}>{value}</span>;
}
