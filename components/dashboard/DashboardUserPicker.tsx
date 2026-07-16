"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";

export function DashboardUserPicker({
  salesId,
  salesOptions,
}: {
  salesId?: string;
  salesOptions: { id: string; display_name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("sales_id", value);
    else next.delete("sales_id");
    const qs = next.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:items-end">
      <label
        htmlFor="dashboard-user-picker"
        className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
      >
        Monitor user
      </label>
      <div className="relative w-full sm:w-[220px]">
        <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          id="dashboard-user-picker"
          value={salesId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="input-field w-full appearance-none py-2.5 pl-9 pr-9 text-sm font-medium"
        >
          <option value="">All users</option>
          {salesOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          ▾
        </span>
      </div>
    </div>
  );
}
