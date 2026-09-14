"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  SALES_STAGES,
  isSalesStage,
  isTerminalWinLose,
  needsOutcomeReason,
  salesStageBadgeClass,
  type SalesStage,
} from "@/lib/salesStage";
import { setPipelineSalesStageAction } from "@/app/dashboard/pipeline/actions";
import {
  StageReasonDialog,
  type StageReasonPayload,
} from "@/components/StageReasonDialog";

/**
 * Inline sales stage select. Lose / On Hold open a compact reason dialog
 * (category + notes). Reopening Win / Lose also asks for a reason.
 */
export function SalesStageSwitcher({
  pipelineId,
  value,
  pipelineLabel,
  size = "md",
  onChanged,
}: {
  pipelineId: string;
  value: string | null | undefined;
  pipelineLabel?: string;
  size?: "sm" | "md";
  onChanged?: (next: SalesStage) => void;
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<SalesStage | "">(
    isSalesStage(value) ? value : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [draftStage, setDraftStage] = useState<SalesStage | null>(null);

  useEffect(() => {
    setOptimistic(isSalesStage(value) ? value : "");
  }, [value]);

  function apply(raw: string) {
    if (!isSalesStage(raw) || raw === optimistic || pending) return;
    const previous = optimistic;
    const reopening = previous !== "" && isTerminalWinLose(previous) && !isTerminalWinLose(raw);
    if (needsOutcomeReason(raw) || reopening) {
      setError(null);
      setDraftStage(raw);
      return;
    }
    commit(raw, { kind: "reopen", reason: "" });
  }

  function commit(stage: SalesStage, payload: StageReasonPayload | { kind: "reopen"; reason: string }) {
    const previous = optimistic;
    setError(null);
    setOptimistic(stage);
    setDraftStage(null);

    startTransition(async () => {
      const result = await setPipelineSalesStageAction({
        id: pipelineId,
        stage,
        reason: payload.kind === "reopen" ? payload.reason || null : payload.category,
        note: payload.kind === "lost" ? payload.notes : null,
        reasonCategory: payload.kind === "lost" ? payload.category : null,
        pipelineLabel: pipelineLabel ?? null,
      });
      if (!result.ok) {
        setOptimistic(previous);
        setError(result.error);
        return;
      }
      onChanged?.(stage);
      router.refresh();
    });
  }

  const height = size === "sm" ? "h-8 text-[11px]" : "h-9 text-xs";
  const tone = optimistic
    ? salesStageBadgeClass(optimistic)
    : "border-slate-200 bg-white text-slate-600";

  const dialogMode =
    draftStage === "Lose"
      ? "lost-lose"
      : draftStage === "On Hold"
        ? "lost-hold"
        : draftStage
          ? "reopen"
          : null;

  return (
    <div className="inline-flex min-w-0 flex-col items-stretch gap-1">
      <div className="relative min-w-[9.5rem] max-w-[12rem]">
        <select
          aria-label="Sales stage"
          disabled={pending}
          value={optimistic}
          onChange={(e) => apply(e.target.value)}
          className={`w-full appearance-none rounded-lg border py-0 pl-2.5 pr-7 font-semibold tracking-tight outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60 ${height} ${tone}`}
        >
          {optimistic === "" && (
            <option value="" disabled>
              Select stage
            </option>
          )}
          {SALES_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-current opacity-60">
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      </div>
      {error && (
        <span className="max-w-[12rem] text-[10px] leading-snug text-red-600">{error}</span>
      )}
      <StageReasonDialog
        open={dialogMode != null}
        mode={dialogMode ?? "reopen"}
        stageLabel={pipelineLabel}
        busy={pending}
        onCancel={() => setDraftStage(null)}
        onConfirm={(payload) => {
          if (draftStage) commit(draftStage, payload);
        }}
      />
    </div>
  );
}

export function SalesStageBulkSelect({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (stage: SalesStage) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Set stage
      </span>
      <div className="relative min-w-[9.5rem]">
        <select
          aria-label="Bulk set sales stage"
          disabled={disabled}
          defaultValue=""
          onChange={(e) => {
            const next = e.target.value;
            e.target.value = "";
            if (isSalesStage(next)) onSelect(next);
          }}
          className="h-8 w-full appearance-none rounded-md border border-slate-200 bg-white py-0 pl-2.5 pr-7 text-[11px] font-bold uppercase tracking-wide text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
        >
          <option value="" disabled>
            Choose…
          </option>
          {SALES_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-slate-400">
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}
