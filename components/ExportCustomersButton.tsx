"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

export function ExportCustomersButton({
  exportQuery = "",
  disabled,
}: {
  /** Optional search query string already URL-encoded (without leading ?) */
  exportQuery?: string;
  disabled?: boolean;
}) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const qs = exportQuery ? `?${exportQuery}` : "";
      const response = await fetch(`/api/export/customers${qs}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ?? `customers-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export customers. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn-secondary gap-2"
      disabled={disabled || exporting}
    >
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Export to Excel
    </button>
  );
}
