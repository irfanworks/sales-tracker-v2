import type { LifecycleStatus } from "@/lib/types/database";

/** Canonical sales stages (pipeline lifecycle). */
export const SALES_STAGES = [
  "Identified",
  "Qualified",
  "Budgetary Submitted",
  "Tender/RFQ",
  "Technical Clarification",
  "Commercial Negotiation",
  "LOA/PO Pending",
  "Win",
  "Lose",
  "On Hold",
] as const;

export type SalesStage = (typeof SALES_STAGES)[number];

export function isSalesStage(value: string | null | undefined): value is SalesStage {
  return SALES_STAGES.includes(value as SalesStage);
}

export function isTerminalWinLose(stage: SalesStage): boolean {
  return stage === "Win" || stage === "Lose";
}

/** Stages excluded from open pipeline / quoted value (same spirit as old Lose/On Hold). */
export function isExcludedSalesStage(stage: string | null | undefined): boolean {
  return stage === "Lose" || stage === "On Hold";
}

/** Late-stage open pipeline value (replaces Hot Prospect heat metric). */
export function isLateSalesStage(stage: string | null | undefined): boolean {
  return (
    stage === "Technical Clarification" ||
    stage === "Commercial Negotiation" ||
    stage === "LOA/PO Pending"
  );
}

export function lifecycleForStage(stage: SalesStage): LifecycleStatus {
  return isTerminalWinLose(stage) ? "Closed" : "Open";
}

export function canCloseWithStage(stage: SalesStage): boolean {
  return isTerminalWinLose(stage);
}

/** Lose / On Hold require a reason category + notes for lost analysis. */
export function needsOutcomeReason(stage: SalesStage | string | null | undefined): boolean {
  return stage === "Lose" || stage === "On Hold";
}

export type PipelineStageHistoryRow = {
  id: string;
  pipeline_id: string;
  stage: SalesStage;
  previous_stage: SalesStage | null;
  changed_at: string;
  changed_by: string | null;
  note: string | null;
  reason: string | null;
  reason_category?: string | null;
};

export function salesStageBadgeClass(stage: SalesStage | string | null | undefined): string {
  switch (stage) {
    case "Win":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Lose":
      return "border-red-200 bg-red-50 text-red-800";
    case "On Hold":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "LOA/PO Pending":
    case "Commercial Negotiation":
      return "border-violet-200 bg-violet-50 text-violet-800";
    case "Tender/RFQ":
    case "Technical Clarification":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "Budgetary Submitted":
    case "Qualified":
      return "border-cyan-200 bg-cyan-50 text-cyan-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}
