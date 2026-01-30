"use client";

import { FileDown } from "lucide-react";
import { exportProjectsToExcel } from "@/lib/exportExcel";
import { format } from "date-fns";

interface ProjectRow {
  id: string;
  created_at: string;
  no_quote: string;
  project_name: string;
  value: number;
  progress_type: string;
  prospect: string;
  sales_name?: string | null;
  customer?: { id: string; name: string };
}

export function ExportProjectsButton({ projects }: { projects: ProjectRow[] }) {
  function handleExport() {
    const rows = projects.map((p) => ({
      no_quote: p.no_quote,
      project_name: p.project_name,
      customer_name: p.customer?.name ?? "",
      value: p.value,
      progress_type: p.progress_type,
      prospect: p.prospect,
      sales_name: p.sales_name ?? "",
      date: format(new Date(p.created_at), "dd MMM yyyy"),
    }));
    exportProjectsToExcel(rows);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn-secondary gap-2"
      disabled={projects.length === 0}
    >
      <FileDown className="h-4 w-4" />
      Export to Excel
    </button>
  );
}
