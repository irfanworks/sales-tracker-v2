"use client";

import { useState } from "react";
import { SalesStageBadge } from "@/components/SalesStageBadge";
import { SalesStageSwitcher } from "@/components/SalesStageSwitcher";
import type { SalesStage } from "@/lib/salesStage";

/**
 * Show a static badge by default; mount the interactive switcher only after
 * the user clicks — keeps list hydration light for 50-row pages.
 */
export function DeferredSalesStageCell({
  pipelineId,
  value,
  pipelineLabel,
  size = "sm",
}: {
  pipelineId: string;
  value: string | null | undefined;
  pipelineLabel?: string;
  size?: "sm" | "md";
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <SalesStageSwitcher
        pipelineId={pipelineId}
        value={value}
        pipelineLabel={pipelineLabel}
        size={size}
        onChanged={() => setEditing(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group inline-flex max-w-full items-center gap-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
      title="Click to change sales stage"
      aria-label={`Sales stage ${value ?? "unset"}. Click to change.`}
    >
      <SalesStageBadge value={value as SalesStage | null} />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 opacity-0 transition group-hover:opacity-100">
        Edit
      </span>
    </button>
  );
}
