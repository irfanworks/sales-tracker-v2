"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

interface CustomerRow {
  id: string;
  name: string;
  sector?: string | null;
  created_at?: string;
  pics?: Array<{ nama: string | null; email: string | null }>;
}

export function ExportCustomersButton({ customers }: { customers: CustomerRow[] }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const { exportCustomersToExcel } = await import("@/lib/exportExcel");
      const { format } = await import("date-fns");
      const rows = customers.map((c) => ({
        name: c.name,
        sector: c.sector ?? "",
        created: c.created_at ? format(new Date(c.created_at), "dd MMM yyyy") : "",
        pics_summary: (c.pics ?? []).map((p) => p.nama || p.email || "").filter(Boolean).join(", ") || "",
      }));
      exportCustomersToExcel(rows);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn-secondary gap-2"
      disabled={customers.length === 0 || exporting}
    >
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Export to Excel
    </button>
  );
}
