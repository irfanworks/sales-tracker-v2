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
    <div className="flex flex-col gap-3.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
          )}
          <h1 className="text-balance text-[1.375rem] font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
        </div>
        {description && (
          <p className="max-w-2xl text-[13px] leading-relaxed text-slate-500 sm:pl-[46px]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:pb-0.5 [&_.btn-primary]:w-full sm:[&_.btn-primary]:w-auto [&_.btn-secondary]:w-full sm:[&_.btn-secondary]:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
