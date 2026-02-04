"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import type { Customer, CustomerPic } from "@/lib/types/database";

interface CustomerRow extends Customer {
  pics?: CustomerPic[];
}

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = customers.length > 0 && selectedIds.size === customers.length;
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(customers.map((c) => c.id)));
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
    const { error: deleteError } = await supabase.from("customers").delete().eq("id", id);
    setDeletingId(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.refresh();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setError(null);
    setBulkDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .in("id", Array.from(selectedIds));
    setBulkDeleting(false);
    if (deleteError) setError(deleteError.message);
    else {
      setSelectedIds(new Set());
      router.refresh();
    }
  }

  if (customers.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No customers yet. Add one above.
      </div>
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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
      <table className="w-full min-w-[480px] text-left text-sm">
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
            <th className="px-4 py-3 font-medium text-slate-700">Name</th>
            <th className="px-4 py-3 font-medium text-slate-700">Sector</th>
            <th className="px-4 py-3 font-medium text-slate-700">PICs</th>
            <th className="px-4 py-3 font-medium text-slate-700">Created</th>
            <th className="px-4 py-3 font-medium text-slate-700 w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="rounded border-slate-300"
                />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/customers/${c.id}`}
                  className="font-medium text-cyan-700 hover:underline"
                >
                  {c.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{c.sector ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">
                {c.pics && c.pics.length > 0
                  ? c.pics.map((p) => p.nama || p.email || "—").join(", ")
                  : "—"}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {c.created_at ? format(new Date(c.created_at), "dd MMM yyyy") : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/customers/${c.id}`}
                    className="inline-flex items-center gap-1 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="inline-flex items-center gap-1 rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
