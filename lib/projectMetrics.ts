export interface ProjectMetricRow {
  value: number | null;
  progress_type: string;
  prospect: string;
  outcome_status?: string | null;
}

export function calcProjectValueMetrics(projects: ProjectMetricRow[]) {
  const totalValueProject = projects
    .filter((p) => p.outcome_status !== "Lose")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueWin = projects
    .filter((p) => p.outcome_status === "Win")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueHotProspect = projects
    .filter((p) => p.prospect === "Hot Prospect" && p.outcome_status !== "Lose")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  return { totalValueProject, totalValueWin, totalValueHotProspect };
}
