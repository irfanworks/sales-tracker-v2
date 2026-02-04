"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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

function getCustomerName(u: BdUpdate): string {
  const c = Array.isArray(u.customers) ? u.customers[0] : u.customers;
  return c?.name ?? "—";
}

export function BdMonitoringTable({
  updates,
  salesNames,
}: {
  updates: BdUpdate[];
  salesNames: Record<string, string>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = updates.length > 0 && selectedIds.size === updates.length;
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(updates.map((u) => u.id)));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("bd_weekly_updates").delete().eq("id", id);
    setDeletingId(null);
    if (deleteError) setError(deleteError.message);
    else router.refresh();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setError(null);
    setBulkDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("bd_weekly_updates")
      .delete()
      .in("id", Array.from(selectedIds));
    setBulkDeleting(false);
    if (deleteError) setError(deleteError.message);
    else {
      setSelectedIds(new Set());
      router.refresh();
    }
  }

  if (updates.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No BD updates from sales yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {someSelected && (
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
          <span className="text-sm text-slate-600">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="btn-secondary gap-2 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete selected
          </button>
        </div>
      )}
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="w-10 px-2 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="rounded border-slate-300"
              />
            </th>
            <th className="px-4 py-3 font-medium text-slate-700 w-48">Week</th>
            <th className="px-4 py-3 font-medium text-slate-700">Sales</th>
            <th className="px-4 py-3 font-medium text-slate-700 w-40">Customer</th>
            <th className="px-4 py-3 font-medium text-slate-700">Update Description</th>
            <th className="px-4 py-3 font-medium text-slate-700 w-40">Update Date</th>
            <th className="px-4 py-3 font-medium text-slate-700 w-16 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {updates.map((u) => (
            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(u.id)}
                  onChange={() => toggleSelect(u.id)}
                  className="rounded border-slate-300"
                />
              </td>
              <td className="px-4 py-3 font-medium text-slate-800">
                {formatWeekLabel(BD_YEAR, u.week_number)}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {salesNames[u.user_id] ?? u.user_id.slice(0, 8)}
              </td>
              <td className="px-4 py-3 text-slate-700">{getCustomerName(u)}</td>
              <td className="px-4 py-3 text-slate-600">
                <div className="whitespace-pre-wrap max-w-md">
                  {u.content?.trim() ?? <span className="text-slate-400 italic">—</span>}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                {formatSubmitTime(u)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleDelete(u.id)}
                  disabled={deletingId === u.id}
                  className="inline-flex items-center gap-1 rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === u.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
