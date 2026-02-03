"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Plus } from "lucide-react";
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
  const [selectedWeek, setSelectedWeek] = useState<number>(weekOptions[0] ?? 53);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const weekUpdates = updates.filter((u) => u.week_number === selectedWeek);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">Pilih Week</label>
          <select
            value={selectedWeek}
            onChange={(e) => {
              setSelectedWeek(Number(e.target.value));
              setEditingId(null);
              setAddingNew(false);
            }}
            className="input-field"
          >
            {weekOptions.map((w) => (
              <option key={w} value={w}>
                {formatWeekLabel(BD_YEAR, w)}
              </option>
            ))}
          </select>
        </div>
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="btn-primary mt-6 gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah BD Update
          </button>
        )}
      </div>

      {(addingNew || weekUpdates.length > 0) && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3 font-medium text-slate-700 w-48">Week</th>
                <th className="px-4 py-3 font-medium text-slate-700 w-48">Customer</th>
                <th className="px-4 py-3 font-medium text-slate-700">Deskripsi Update</th>
                <th className="px-4 py-3 font-medium text-slate-700 w-40">Tanggal Update</th>
                <th className="px-4 py-3 font-medium text-slate-700 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {addingNew && (
                <tr className="border-b border-slate-100 bg-slate-50/30">
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
              {weekUpdates.map((update) => (
                <tr key={update.id} className="border-b border-slate-100 hover:bg-slate-50/50">
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
                              <span className="text-slate-400 italic">Belum diisi</span>
                            )}
                          </div>
                          {formatSubmitTime(update) && (
                            <p className="mt-1.5 text-xs text-slate-500">
                              Terakhir update: {formatSubmitTime(update)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatSubmitTime(update)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingId(update.id)}
                          className="inline-flex items-center gap-1 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!addingNew && weekUpdates.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-slate-500">
          Belum ada BD update untuk week ini. Klik &quot;Tambah BD Update&quot; untuk menambah.
        </div>
      )}
    </div>
  );
}
