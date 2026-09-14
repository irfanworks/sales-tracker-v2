import { isExcludedSalesStage, isLateSalesStage } from "@/lib/salesStage";

export interface PipelineMetricRow {
  value: number | null;
  sales_stage: string | null;
  status?: string | null;
}

/** Stages excluded from Quoted Pipeline / Late Stage value totals */
export function isExcludedFromQuotedValue(stage: string | null | undefined): boolean {
  return isExcludedSalesStage(stage);
}

export function calcPipelineValueMetrics(rows: PipelineMetricRow[]) {
  const totalValueProject = rows
    .filter(
      (p) => (p.status ?? "Open") === "Open" && !isExcludedFromQuotedValue(p.sales_stage)
    )
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueWin = rows
    .filter((p) => p.sales_stage === "Win")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueLateStage = rows
    .filter((p) => isLateSalesStage(p.sales_stage) && (p.status ?? "Open") === "Open")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  return { totalValueProject, totalValueWin, totalValueLateStage };
}

export function calcPipelineSecondaryMetrics(rows: PipelineMetricRow[]) {
  const projectLose = rows.filter((p) => p.sales_stage === "Lose").length;

  const onHoldPipelines = rows.filter((p) => p.sales_stage === "On Hold");
  const projectOnHold = onHoldPipelines.length;
  const valueProjectOnHold = onHoldPipelines.reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const tenderOnProgress = rows.filter(
    (p) => p.sales_stage === "Tender/RFQ" && (p.status ?? "Open") === "Open"
  ).length;

  return { projectLose, projectOnHold, valueProjectOnHold, tenderOnProgress };
}
