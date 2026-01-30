import * as XLSX from "xlsx";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportProjectsToExcel(
  rows: Array<{
    no_quote: string;
    project_name: string;
    customer_name: string;
    value: number;
    progress_type: string;
    prospect: string;
    sales_name: string;
    date: string;
  }>
) {
  const data = rows.map((p) => ({
    "No Quote": p.no_quote,
    "Project Name": p.project_name,
    Customer: p.customer_name,
    Value: p.value,
    "Progress Type": p.progress_type,
    Prospect: p.prospect,
    Sales: p.sales_name,
    Date: p.date,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Projects");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const filename = `projects-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  downloadBlob(blob, filename);
}

export function exportCustomersToExcel(
  rows: Array<{
    name: string;
    sector: string;
    created: string;
    pics_summary: string;
  }>
) {
  const data = rows.map((c) => ({
    Name: c.name,
    Sector: c.sector || "",
    Created: c.created,
    PICs: c.pics_summary || "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const filename = `customers-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  downloadBlob(blob, filename);
}
