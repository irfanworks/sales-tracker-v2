"use client";

import { useState } from "react";
import { PipelineStatusToggle } from "@/components/PipelineStatusToggle";
import type { LifecycleStatus } from "@/lib/types/database";

/**
 * Static Open/Closed chip until clicked — avoids mounting StageReasonDialog
 * (and toggle state) on every list row.
 */
export function DeferredPipelineStatusCell({
  projectId,
  status,
  salesStage,
  pipelineLabel,
}: {
  projectId: string;
  status: LifecycleStatus;
  salesStage?: string | null;
  pipelineLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const isOpen = status !== "Closed";

  if (editing) {
    return (
      <PipelineStatusToggle
        projectId={projectId}
        status={status}
        salesStage={salesStage}
        pipelineLabel={pipelineLabel}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to change status"
      aria-label={`Status: ${isOpen ? "Open" : "Closed"}. Click to change.`}
      className={`group inline-flex h-8 items-center rounded-full border px-3 text-[10px] font-bold uppercase tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
        isOpen
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 focus-visible:ring-emerald-400/40"
          : "border-slate-300 bg-slate-100 text-slate-700 focus-visible:ring-slate-400/40"
      }`}
    >
      {isOpen ? "Open" : "Closed"}
      <span className="ml-1.5 text-[9px] font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100">
        Edit
      </span>
    </button>
  );
}
