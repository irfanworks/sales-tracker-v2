export interface ProjectMetricRow {
  value: number;
  progress_type: string;
  prospect: string;
}

export function calcProjectValueMetrics(projects: ProjectMetricRow[]) {
  const totalValueProject = projects
    .filter((p) => p.progress_type !== "Lose")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueWin = projects
    .filter((p) => p.progress_type === "Win")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  const totalValueHotProspect = projects
    .filter((p) => p.prospect === "Hot Prospect" && p.progress_type !== "Lose")
    .reduce((sum, p) => sum + Number(p.value ?? 0), 0);

  return { totalValueProject, totalValueWin, totalValueHotProspect };
}
