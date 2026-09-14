import { salesStageBadgeClass } from "@/lib/salesStage";

export function SalesStageBadge({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="text-slate-400">—</span>;
  }

  return <span className={`badge border ${salesStageBadgeClass(value)}`}>{value}</span>;
}
