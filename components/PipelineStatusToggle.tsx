"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { LifecycleStatus } from "@/lib/types/database";
import { isSalesStage, isTerminalWinLose } from "@/lib/salesStage";
import { setPipelineLifecycleAction } from "@/app/dashboard/pipeline/actions";
import { StageReasonDialog } from "@/components/StageReasonDialog";

export function PipelineStatusToggle({
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
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticOverride, setOptimisticOverride] = useState<LifecycleStatus | null>(null);
  const [reopenOpen, setReopenOpen] = useState(false);

  const optimisticStatus = optimisticOverride ?? status;
  const isOpen = optimisticStatus === "Open";
  const nextStatus: LifecycleStatus = isOpen ? "Closed" : "Open";
  const stage = isSalesStage(salesStage) ? salesStage : null;

  async function apply(reason: string | null) {
    setSaving(true);
    setOptimisticOverride(nextStatus);

    const result = await setPipelineLifecycleAction({
      id: projectId,
      status: nextStatus,
      reason,
      pipelineLabel: pipelineLabel ?? null,
    });

    setSaving(false);
    if (!result.ok) {
      setOptimisticOverride(null);
      setError(result.error);
      return;
    }

    router.refresh();
  }

  async function handleToggle() {
    setError(null);

    if (isOpen) {
      if (stage != null && !isTerminalWinLose(stage)) {
        setError("Set stage to Win or Lose first");
        return;
      }
      const confirmed = window.confirm(
        "Mark this pipeline as Closed?\n\nClosed means the deal is decided (Win or Lose) and no longer being pursued."
      );
      if (!confirmed) return;
      await apply(null);
      return;
    }

    setReopenOpen(true);
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        title={
          isOpen
            ? "Click to mark Closed (only allowed on Win / Lose)"
            : "Click to reopen (a reason is required)"
        }
        aria-pressed={!isOpen}
        aria-label={`Status: ${optimisticStatus}. Toggle to ${nextStatus}`}
        className={`group relative inline-flex h-8 w-[5.75rem] items-center rounded-full border px-1 transition-all duration-300 ease-premium will-change-transform focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ${
          isOpen
            ? "border-emerald-200 bg-emerald-50 focus:ring-emerald-400/40"
            : "border-slate-300 bg-slate-100 focus:ring-slate-400/40"
        }`}
      >
        <span
          className={`absolute inset-y-0 left-0 flex w-1/2 items-center justify-center text-[10px] font-bold uppercase tracking-wide transition-opacity duration-300 ${
            isOpen ? "opacity-100 text-emerald-800" : "opacity-40 text-slate-500"
          }`}
        >
          Open
        </span>
        <span
          className={`absolute inset-y-0 right-0 flex w-1/2 items-center justify-center text-[10px] font-bold uppercase tracking-wide transition-opacity duration-300 ${
            !isOpen ? "opacity-100 text-slate-700" : "opacity-40 text-slate-400"
          }`}
        >
          Closed
        </span>
        <span
          className={`relative z-[1] flex h-6 w-[calc(50%-2px)] items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wide text-white shadow-sm transition-transform duration-300 ease-premium ${
            isOpen
              ? "translate-x-0 bg-gradient-to-b from-emerald-500 to-emerald-600"
              : "translate-x-full bg-gradient-to-b from-slate-500 to-slate-600"
          }`}
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isOpen ? (
            "Open"
          ) : (
            "Closed"
          )}
        </span>
      </button>
      {error && <span className="max-w-[9rem] text-[10px] text-red-600">{error}</span>}
      <StageReasonDialog
        open={reopenOpen}
        mode="reopen"
        stageLabel={pipelineLabel}
        busy={saving}
        onCancel={() => {
          if (!saving) setReopenOpen(false);
        }}
        onConfirm={(payload) => {
          if (payload.kind !== "reopen") return;
          setReopenOpen(false);
          void apply(payload.reason);
        }}
      />
    </div>
  );
}
