"use client";

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

function formatSubmitTime(u: BdUpdate): string {
  const ts = u.updated_at ?? u.created_at;
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy, HH:mm");
}

export function BdMonitoringTable({
  updates,
  salesNames,
}: {
  updates: BdUpdate[];
  salesNames: Record<string, string>;
}) {
  const updatesByWeek = new Map<string, BdUpdate[]>();
  for (const u of updates) {
    const key = `${u.week_number}`;
    if (!updatesByWeek.has(key)) updatesByWeek.set(key, []);
    updatesByWeek.get(key)!.push(u);
  }

  const weeks = Array.from({ length: 53 }, (_, i) => 53 - i);

  if (updates.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        Belum ada BD update dari sales.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-4 py-3 font-medium text-slate-700 w-48">Week</th>
            <th className="px-4 py-3 font-medium text-slate-700">Sales</th>
            <th className="px-4 py-3 font-medium text-slate-700 w-40">Customer</th>
            <th className="px-4 py-3 font-medium text-slate-700">Deskripsi Update</th>
            <th className="px-4 py-3 font-medium text-slate-700 w-40">Tanggal Update</th>
          </tr>
        </thead>
        <tbody>
          {weeks.flatMap((weekNumber) => {
            const weekUpdates = updatesByWeek.get(String(weekNumber)) ?? [];
            return weekUpdates.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {formatWeekLabel(BD_YEAR, weekNumber)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {salesNames[u.user_id] ?? u.user_id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {(() => {
                    const c = Array.isArray(u.customers) ? u.customers[0] : u.customers;
                    return c?.name ?? "—";
                  })()}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="whitespace-pre-wrap max-w-md">
                    {u.content?.trim() ?? <span className="text-slate-400 italic">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {formatSubmitTime(u)}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
