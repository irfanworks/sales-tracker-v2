export interface ProjectMetricRow {
  value: number | null;
  progress_type: string;
  prospect: string;
  outcome_status?: string | null;
  status?: string | null;
}

/** Outcomes excluded from Quoted Project / Hot Prospect value totals */
export function isExcludedFromQuotedValue(outcome: string | null | undefined): boolean {
  return outcome === "Lose" || outcome === "On Hold";
}

export function calcProjectValueMetrics(projects: ProjectMetricRow[]) {
  const totalValueProject = projects
    .filter((p) => !isExcludedFromQuotedValue(p.outcome_status))
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueWin = projects
    .filter((p) => p.outcome_status === "Win")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueHotProspect = projects
    .filter((p) => p.prospect === "Hot Prospect" && !isExcludedFromQuotedValue(p.outcome_status))
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  return { totalValueProject, totalValueWin, totalValueHotProspect };
}

export function calcProjectSecondaryMetrics(projects: ProjectMetricRow[]) {
  const projectLose = projects.filter((p) => p.outcome_status === "Lose").length;

  const onHoldProjects = projects.filter((p) => p.outcome_status === "On Hold");
  const projectOnHold = onHoldProjects.length;
  const valueProjectOnHold = onHoldProjects.reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const tenderOnProgress = projects.filter(
    (p) => p.progress_type === "Tender" && (p.status ?? "Open") === "Open"
  ).length;

  return { projectLose, projectOnHold, valueProjectOnHold, tenderOnProgress };
}
