import "server-only";
import * as XLSX from "xlsx";

export type CustomerExportRow = {
  name: string;
  sector: string;
  customer_role: string;
  created: string;
  pics_summary: string;
};

export function buildCustomersWorkbook(rows: CustomerExportRow[]) {
  const data = rows.map((c) => ({
    Name: c.name,
    Sector: c.sector || "",
    "Customer Role": c.customer_role || "",
    Created: c.created,
    PICs: c.pics_summary || "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  return XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;
}
