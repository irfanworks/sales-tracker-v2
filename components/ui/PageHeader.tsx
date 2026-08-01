import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600">
              <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
          )}
          <h1 className="text-balance text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
        </div>
        {description && (
          <p className="max-w-2xl text-[13px] leading-relaxed text-slate-500 sm:pl-[42px]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pb-0.5">{actions}</div>
      )}
    </div>
  );
}
