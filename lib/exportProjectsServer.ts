import * as XLSX from "xlsx";
import type { ProjectExportRow } from "@/lib/exportExcel";

export function buildProjectsWorkbook(rows: ProjectExportRow[]) {
  const data = rows.map((p) => {
    const updatesText =
      p.updates && p.updates.length > 0
        ? p.updates
            .map(
              (u) =>
                `${new Date(u.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}: ${u.content}`
            )
            .join("\n")
        : "";

    return {
      "No Quote": p.no_quote,
      "Project Name": p.project_name,
      Customer: p.customer_name,
      Value: p.value,
      "Progress Type": p.progress_type,
      Outcome: p.outcome_status ?? "",
      Prospect: p.prospect,
      Sales: p.sales_name,
      Date: p.date,
      "Target Closing": p.target_closing_at ?? "",
      "All Updates": updatesText,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Projects");

  const updateRows: Array<{
    "No Quote": string;
    "Project Name": string;
    "Update Date": string;
    Content: string;
  }> = [];

  rows.forEach((p) => {
    (p.updates ?? []).forEach((u) => {
      updateRows.push({
        "No Quote": p.no_quote,
        "Project Name": p.project_name,
        "Update Date": new Date(u.created_at).toLocaleString("en-GB", {
          dateStyle: "short",
          timeStyle: "short",
        }),
        Content: u.content,
      });
    });
  });

  if (updateRows.length > 0) {
    const wsUpdates = XLSX.utils.json_to_sheet(updateRows);
    XLSX.utils.book_append_sheet(wb, wsUpdates, "Project Updates");
  }

  return XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;
}
