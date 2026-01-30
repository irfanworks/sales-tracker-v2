"use client";

import { FileDown } from "lucide-react";
import { exportCustomersToExcel } from "@/lib/exportExcel";
import { format } from "date-fns";

interface CustomerRow {
  id: string;
  name: string;
  sector?: string | null;
  created_at?: string;
  pics?: Array<{ nama: string | null; email: string | null }>;
}

export function ExportCustomersButton({ customers }: { customers: CustomerRow[] }) {
  function handleExport() {
    const rows = customers.map((c) => ({
      name: c.name,
      sector: c.sector ?? "",
      created: c.created_at ? format(new Date(c.created_at), "dd MMM yyyy") : "",
      pics_summary: (c.pics ?? []).map((p) => p.nama || p.email || "").filter(Boolean).join(", ") || "",
    }));
    exportCustomersToExcel(rows);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn-secondary gap-2"
      disabled={customers.length === 0}
    >
      <FileDown className="h-4 w-4" />
      Export to Excel
    </button>
  );
}
