"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Pencil, Trash2, Loader2, Users, Search, X } from "lucide-react";
import type { Customer, CustomerPic } from "@/lib/types/database";
import { customerDetailPath } from "@/lib/customerPaths";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

interface CustomerRow extends Customer {
  pics?: CustomerPic[];
}

type PendingDelete =
  | { type: "one"; id: string; label: string }
  | { type: "bulk"; ids: string[]; count: number };

function matchesCustomerSearch(c: CustomerRow, q: string): boolean {
  if (!q) return true;
  if (c.name.toLowerCase().includes(q)) return true;
  if ((c.sector ?? "").toLowerCase().includes(q)) return true;
  return (c.pics ?? []).some((p) => {
    const hay = [p.nama, p.email, p.jabatan, p.no_hp]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDelete | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () => customers.filter((c) => matchesCustomerSearch(c, normalizedQuery)),
    [customers, normalizedQuery]
  );

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;
  const busy = deletingId != null || bulkDeleting;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of filtered) next.delete(c.id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of filtered) next.add(c.id);
        return next;
      });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function requestDeleteOne(id: string) {
    const row = customers.find((c) => c.id === id);
    setPending({
      type: "one",
      id,
      label: row?.name?.trim() || "this customer",
    });
  }

  function requestBulkDelete() {
    if (selectedIds.size === 0) return;
    setPending({
      type: "bulk",
      ids: Array.from(selectedIds),
      count: selectedIds.size,
    });
  }

  async function executePendingDelete() {
    if (!pending) return;
    setError(null);

    if (pending.type === "one") {
      setDeletingId(pending.id);
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", pending.id);
      setDeletingId(null);
      setPending(null);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      router.refresh();
      return;
    }

    setBulkDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .in("id", pending.ids);
    setBulkDeleting(false);
    setPending(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setSelectedIds(new Set());
    router.refresh();
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

  const dialogTitle =
    pending?.type === "bulk"
      ? `Delete ${pending.count} customer${pending.count === 1 ? "" : "s"}?`
      : pending
        ? `Delete customer “${pending.label}”?`
        : "";

  const dialogMessage =
    "Related pipelines/prospects may be affected.\nThis cannot be undone.";

  const searchBar = (
    <div className="border-b border-slate-200/80 bg-white px-3 py-3 sm:px-4">
      <label className="relative block">
        <span className="sr-only">Search customers or PIC</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer or PIC name…"
          className="input-field w-full pl-9 pr-9"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </label>
      {normalizedQuery ? (
        <p className="mt-2 text-xs text-slate-500">
          {filtered.length === 0
            ? "No matches"
            : `${filtered.length} of ${customers.length} customer${customers.length === 1 ? "" : "s"}`}
        </p>
      ) : null}
    </div>
  );

  const toolbar = (
    <>
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}
      {someSelected && (
        <div className="sticky top-[calc(var(--header-height)+env(safe-area-inset-top,0px))] z-[2] flex items-center gap-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2.5 backdrop-blur-sm md:static md:bg-slate-50/90 md:backdrop-blur-none">
          <span className="text-sm font-medium text-slate-600">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={requestBulkDelete}
            disabled={busy}
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
      <ConfirmDeleteDialog
        open={pending != null}
        title={dialogTitle}
        message={dialogMessage}
        confirmLabel="Yes, delete"
        busy={busy}
        onCancel={() => {
          if (!busy) setPending(null);
        }}
        onConfirm={() => {
          void executePendingDelete();
        }}
      />

      {searchBar}
      {toolbar}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No customers match"
          description="Try another name, sector, or PIC. Clear search to see everyone."
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2.5 p-3 md:hidden">
            {filtered.map((c) => (
              <div key={c.id} className="mobile-list-card">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="checkbox-touch mt-1"
                    aria-label={`Select ${c.name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <Link href={customerDetailPath(c)} className="mobile-list-title block text-cyan-800">
                      {c.name}
                    </Link>
                    <p className="mobile-list-sub mt-1">{c.sector ?? "No sector"}</p>
                    {c.pics && c.pics.length > 0 && (
                      <p className="mobile-list-meta mt-1">
                        PIC: {c.pics.map((p) => p.nama || p.email || "—").join(", ")}
                      </p>
                    )}
                    <p className="mobile-list-meta mt-1">
                      {c.created_at ? format(new Date(c.created_at), "dd MMM yyyy") : "—"}
                    </p>
                    <div className="mt-3 flex gap-1">
                      <Link href={customerDetailPath(c)} className="icon-btn gap-1.5 px-3 text-slate-600">
                        <Pencil className="h-4 w-4" />
                        <span className="text-sm font-medium">Edit</span>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          requestDeleteOne(c.id);
                        }}
                        disabled={busy}
                        className="icon-btn text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${c.name}`}
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
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
                {filtered.map((c) => (
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
                          className="icon-btn text-slate-500"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            requestDeleteOne(c.id);
                          }}
                          disabled={busy}
                          className="icon-btn text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
        </>
      )}
    </div>
  );
}
