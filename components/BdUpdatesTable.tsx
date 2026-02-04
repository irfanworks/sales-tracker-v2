"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { BdUpdateForm } from "./BdUpdateForm";
import { formatWeekLabel } from "@/lib/utils/weekDates";
import type { BdWeeklyUpdate } from "@/lib/types/database";

const BD_YEAR = 2026;

function formatSubmitTime(update: BdWeeklyUpdate | null): string | null {
  if (!update) return null;
  const ts = update.updated_at ?? update.created_at;
  if (!ts) return null;
  return format(new Date(ts), "dd MMM yyyy, HH:mm");
}

const weekOptions = Array.from({ length: 53 }, (_, i) => 53 - i);

export function BdUpdatesTable({
  updates,
  userId,
  customers,
}: {
  updates: BdWeeklyUpdate[];
  userId: string;
  customers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState<number>(weekOptions[0] ?? 53);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedUpdates = useMemo(
    () => [...updates].sort((a, b) => b.week_number - a.week_number),
    [updates]
  );

  const allSelected = sortedUpdates.length > 0 && selectedIds.size === sortedUpdates.length;
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedUpdates.map((u) => u.id)));
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="btn-primary gap-2"
          >
            <Plus className="h-4 w-4" />
            Add BD Update
          </button>
        )}
        {addingNew && (
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-slate-500">Select Week</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="input-field"
              >
                {weekOptions.map((w) => (
                  <option key={w} value={w}>
                    {formatWeekLabel(BD_YEAR, w)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {(addingNew || sortedUpdates.length > 0) && (
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
          <table className="w-full min-w-[600px] text-left text-sm">
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
                <th className="px-4 py-3 font-medium text-slate-700 w-48">Customer</th>
                <th className="px-4 py-3 font-medium text-slate-700">Update Description</th>
                <th className="px-4 py-3 font-medium text-slate-700 w-40">Update Date</th>
                <th className="px-4 py-3 font-medium text-slate-700 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {addingNew && (
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <td className="w-10 px-2 py-3"></td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatWeekLabel(BD_YEAR, selectedWeek)}
                  </td>
                  <td colSpan={4} className="px-4 py-3 align-top">
                    <BdUpdateForm
                      userId={userId}
                      year={BD_YEAR}
                      weekNumber={selectedWeek}
                      customerId={null}
                      initialContent=""
                      customers={customers}
                      updateId={undefined}
                      onClose={() => setAddingNew(false)}
                      onSaved={() => setAddingNew(false)}
                    />
                  </td>
                </tr>
              )}
              {sortedUpdates.map((update) => (
                <tr key={update.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="w-10 px-2 py-3">
                    {editingId !== update.id && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(update.id)}
                        onChange={() => toggleSelect(update.id)}
                        className="rounded border-slate-300"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {formatWeekLabel(BD_YEAR, update.week_number)}
                  </td>
                  {editingId === update.id ? (
                    <td colSpan={4} className="px-4 py-3">
                      <BdUpdateForm
                        userId={userId}
                        year={BD_YEAR}
                        weekNumber={update.week_number}
                        customerId={update.customer_id}
                        initialContent={update.content ?? ""}
                        customers={customers}
                        updateId={update.id}
                        onClose={() => setEditingId(null)}
                        onSaved={() => setEditingId(null)}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-slate-700">
                        {update.customer?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>
                          <div className="whitespace-pre-wrap">
                            {update.content?.trim() ? (
                              update.content
                            ) : (
                              <span className="text-slate-400 italic">Not filled</span>
                            )}
                          </div>
                          {formatSubmitTime(update) && (
                            <p className="mt-1.5 text-xs text-slate-500">
                              Last updated: {formatSubmitTime(update)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatSubmitTime(update)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(update.id)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(update.id)}
                            disabled={deletingId === update.id}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === update.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!addingNew && sortedUpdates.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-slate-500">
          No BD updates yet. Click &quot;Add BD Update&quot; to add.
        </div>
      )}
    </div>
  );
}
