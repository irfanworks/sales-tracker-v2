"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

type ProgressType = "Budgetary" | "Tender" | "Win" | "Loss";

const OPTIONS: { value: "" | ProgressType; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "Budgetary", label: "Budgetary" },
  { value: "Tender", label: "Tender" },
  { value: "Win", label: "Win" },
  { value: "Loss", label: "Loss" },
];

interface ProgressTypeFilterProps {
  current?: ProgressType | string;
}

export function ProgressTypeFilter({ current }: ProgressTypeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set("progress_type", value);
    } else {
      next.delete("progress_type");
    }
    router.push(`/dashboard?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-slate-500" />
      <select
        value={current ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
