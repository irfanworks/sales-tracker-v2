export interface PipelineMetricRow {
  value: number | null;
  progress_type: string;
  prospect: string;
  outcome_status?: string | null;
  status?: string | null;
}

/** Outcomes excluded from Quoted Pipeline / Hot Prospect value totals */
export function isExcludedFromQuotedValue(outcome: string | null | undefined): boolean {
  return outcome === "Lose" || outcome === "On Hold";
}

export function calcPipelineValueMetrics(rows: PipelineMetricRow[]) {
  const totalValueProject = rows
    .filter((p) => !isExcludedFromQuotedValue(p.outcome_status))
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueWin = rows
    .filter((p) => p.outcome_status === "Win")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueHotProspect = rows
    .filter((p) => p.prospect === "Hot Prospect" && !isExcludedFromQuotedValue(p.outcome_status))
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  return { totalValueProject, totalValueWin, totalValueHotProspect };
}

export function calcPipelineSecondaryMetrics(rows: PipelineMetricRow[]) {
  const projectLose = rows.filter((p) => p.outcome_status === "Lose").length;

  const onHoldPipelines = rows.filter((p) => p.outcome_status === "On Hold");
  const projectOnHold = onHoldPipelines.length;
  const valueProjectOnHold = onHoldPipelines.reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const tenderOnProgress = rows.filter(
    (p) => p.progress_type === "Tender" && (p.status ?? "Open") === "Open"
  ).length;

  return { projectLose, projectOnHold, valueProjectOnHold, tenderOnProgress };
}
