"use client";

import { FileDown } from "lucide-react";
import { exportBdUpdatesToExcel } from "@/lib/exportExcel";
import { format } from "date-fns";
import { formatWeekLabel } from "@/lib/utils/weekDates";

const BD_YEAR = 2026;

interface BdUpdate {
  id: string;
  user_id: string;
  year: number;
  week_number: number;
  customer_id: string | null;
  content: string | null;
  created_at?: string;
  updated_at?: string;
  customers?: { id: string; name: string } | { id: string; name: string }[] | null;
}

export function ExportBdUpdatesButton({
  updates,
  salesNames,
}: {
  updates: BdUpdate[];
  salesNames: Record<string, string>;
}) {
  function handleExport() {
    const rows = updates.map((u) => {
      const c = Array.isArray(u.customers) ? u.customers[0] : u.customers;
      const customerName = c?.name ?? "—";
      const ts = u.updated_at ?? u.created_at;
      const updatedAt = ts ? format(new Date(ts), "dd MMM yyyy, HH:mm") : "—";
      return {
        week: formatWeekLabel(BD_YEAR, u.week_number),
        sales_name: salesNames[u.user_id] ?? u.user_id.slice(0, 8),
        customer_name: customerName,
        content: u.content?.trim() ?? "",
        updated_at: updatedAt,
      };
    });
    exportBdUpdatesToExcel(rows);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn-secondary gap-2"
      disabled={updates.length === 0}
    >
      <FileDown className="h-4 w-4" />
      Export to Excel
    </button>
  );
}
