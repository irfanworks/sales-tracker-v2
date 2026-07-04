"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Pencil, Trash2, Loader2, Users } from "lucide-react";
import type { Customer, CustomerPic } from "@/lib/types/database";
import { customerDetailPath } from "@/lib/customerPaths";
import { EmptyState } from "@/components/ui/EmptyState";

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
      <EmptyState
        icon={Users}
        title="No customers yet"
        description="Add your first customer using the form above."
      />
    );
  }

  const toolbar = (
    <>
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}
      {someSelected && (
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-2.5">
          <span className="text-sm font-medium text-slate-600">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="btn-secondary gap-2 text-red-700 hover:border-red-200 hover:bg-red-50"
          >
            {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete selected
          </button>
        </div>
      )}
    </>
  );

  return (
    <div>
      {toolbar}

      {/* Mobile cards */}
      <div className="divide-y divide-slate-100 md:hidden">
        {customers.map((c) => (
          <div key={c.id} className="p-4 transition hover:bg-slate-50/50">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(c.id)}
                onChange={() => toggleSelect(c.id)}
                className="mt-1 rounded border-slate-300"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={customerDetailPath(c)}
                  className="font-semibold text-cyan-700 hover:underline"
                >
                  {c.name}
                </Link>
                <p className="mt-1 text-sm text-slate-600">{c.sector ?? "No sector"}</p>
                {c.pics && c.pics.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    PIC: {c.pics.map((p) => p.nama || p.email || "—").join(", ")}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {c.created_at ? format(new Date(c.created_at), "dd MMM yyyy") : "—"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={customerDetailPath(c)}
                    className="btn-ghost gap-1 px-2 py-1.5 text-slate-600"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="btn-ghost gap-1 px-2 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    {deletingId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="table-header-row">
              <th className="w-10 px-3 py-3.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-3.5">Name</th>
              <th className="px-4 py-3.5">Sector</th>
              <th className="px-4 py-3.5">PICs</th>
              <th className="px-4 py-3.5">Created</th>
              <th className="w-32 px-4 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="table-row">
                <td className="w-10 px-3 py-3.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={customerDetailPath(c)}
                    className="font-medium text-cyan-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-slate-600">{c.sector ?? "—"}</td>
                <td className="px-4 py-3.5 text-slate-600">
                  {c.pics && c.pics.length > 0
                    ? c.pics.map((p) => p.nama || p.email || "—").join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3.5 text-slate-500">
                  {c.created_at ? format(new Date(c.created_at), "dd MMM yyyy") : "—"}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1">
                    <Link
                      href={customerDetailPath(c)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
    </div>
  );
}
