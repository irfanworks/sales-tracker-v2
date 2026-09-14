import "server-only";
import * as XLSX from "xlsx";

export type ProjectExportRow = {
  no_quote: string;
  pipeline_name: string;
  customer_name: string;
  pic_name?: string | null;
  value: number;
  pipeline_type?: string | null;
  sales_stage: string;
  sales_stage_changed_at?: string | null;
  sales_name: string;
  date: string;
  target_closing_at?: string | null;
  status?: string | null;
  updates?: Array<{ content: string; created_at: string }>;
};

export function buildPipelinesWorkbook(rows: ProjectExportRow[]) {
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
      "Pipeline Name": p.pipeline_name,
      Customer: p.customer_name,
      PIC: p.pic_name ?? "",
      Value: p.value,
      Type: p.pipeline_type ?? "Project",
      "Sales Stage": p.sales_stage,
      "Stage Changed": p.sales_stage_changed_at
        ? new Date(p.sales_stage_changed_at).toLocaleDateString("en-GB")
        : "",
      Sales: p.sales_name,
      Date: p.date,
      "Target Closing": p.target_closing_at ?? "",
      Status: p.status ?? "Open",
      "All Updates": updatesText,
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pipeline");

  const updateRows: Array<{
    "No Quote": string;
    "Pipeline Name": string;
    "Update Date": string;
    Content: string;
  }> = [];
  rows.forEach((p) => {
    (p.updates ?? []).forEach((u) => {
      updateRows.push({
        "No Quote": p.no_quote,
        "Pipeline Name": p.pipeline_name,
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
