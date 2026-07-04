import type { LucideIcon } from "lucide-react";

type Variant = "default" | "cyan" | "emerald" | "amber" | "violet";

const variantStyles: Record<
  Variant,
  { ring: string; bg: string; icon: string }
> = {
  default: {
    ring: "ring-slate-200/70",
    bg: "bg-slate-100 text-slate-700",
    icon: "from-slate-400 to-slate-600",
  },
  cyan: {
    ring: "ring-cyan-200/60",
    bg: "bg-cyan-50 text-cyan-700",
    icon: "from-cyan-400 to-cyan-600",
  },
  emerald: {
    ring: "ring-emerald-200/60",
    bg: "bg-emerald-50 text-emerald-700",
    icon: "from-emerald-400 to-emerald-600",
  },
  amber: {
    ring: "ring-amber-200/60",
    bg: "bg-amber-50 text-amber-700",
    icon: "from-amber-400 to-amber-600",
  },
  violet: {
    ring: "ring-violet-200/60",
    bg: "bg-violet-50 text-violet-700",
    icon: "from-violet-400 to-violet-600",
  },
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  variant?: Variant;
}) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`card-interactive flex items-start gap-4 p-5 ring-1 sm:gap-5 sm:p-6 ${styles.ring}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${styles.icon} text-white shadow-sm`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="mt-1.5 min-w-0 text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl">
          {value}
        </div>
        {hint && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
