"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, Loader2, Target, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ProspectStatusBadge } from "@/components/ProspectStatusBadge";
import { customerDetailPath } from "@/lib/customerPaths";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProspectStatus } from "@/lib/types/database";
import { formatPicWithSalutation } from "@/lib/types/database";
import { logSalesActivity } from "@/lib/salesActivity";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

const linkClass =
  "font-medium text-cyan-700 transition hover:text-cyan-800 hover:underline";

interface ProspectRow {
  id: string;
  created_at: string;
  title: string;
  work_description: string | null;
  pic_name?: string | null;
  pic_salutation?: string | null;
  status: ProspectStatus;
  latest_update: string | null;
  sales_id: string;
  customer?: { id: string; name: string; slug?: string | null } | null;
  sales_name?: string | null;
}

export function ProspectsTable({
  prospects,
  emptyMessage,
  showSales = false,
}: {
  prospects: ProspectRow[];
  emptyMessage?: string;
  showSales?: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; title: string } | null>(null);

  async function executeDelete() {
    if (!pending) return;
    const { id, title } = pending;
    setError(null);
    setDeletingId(id);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("prospects").delete().eq("id", id);
    setDeletingId(null);
    setPending(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await logSalesActivity(supabase, {
        actorId: user.id,
        actionType: "prospect_deleted",
        entityType: "prospect",
        entityId: id,
        entityLabel: title,
        summary: `Deleted prospect “${title}”`,
      });
    }
    router.refresh();
  }

  if (prospects.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title={emptyMessage ?? "No prospects yet"}
        description="Capture pre-quote opportunities — customer, work, and progress updates."
      />
    );
  }

  return (
    <div>
      <ConfirmDeleteDialog
        open={pending != null}
        title={pending ? `Delete prospect “${pending.title}”?` : ""}
        message="This cannot be undone."
        confirmLabel="Yes, delete"
        busy={deletingId != null}
        onCancel={() => {
          if (deletingId == null) setPending(null);
        }}
        onConfirm={() => {
          void executeDelete();
        }}
      />
      {error && (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Mobile cards */}
      <div className="space-y-2.5 p-3 md:hidden">
        {prospects.map((p) => (
          <div key={p.id} className="mobile-list-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/prospects/${p.id}`} className="mobile-list-title block text-cyan-800">
                  {p.title}
                </Link>
                <p className="mobile-list-sub mt-1">
                  {p.customer ? (
                    <Link
                      href={customerDetailPath({
                        id: p.customer.id,
                        slug: p.customer.slug,
                        name: p.customer.name,
                      })}
                      className="font-medium text-cyan-700"
                    >
                      {p.customer.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </p>
                <p className="mobile-list-meta mt-1">
                  {formatPicWithSalutation(p.pic_salutation, p.pic_name)}
                </p>
              </div>
              <ProspectStatusBadge value={p.status} />
            </div>
            {p.work_description && (
              <p className="mobile-list-sub mt-2 line-clamp-2">{p.work_description}</p>
            )}
            {p.latest_update && (
              <p className="mobile-list-meta mt-2 line-clamp-2">{p.latest_update}</p>
            )}
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              <p className="mobile-list-meta">
                {showSales && p.sales_name ? `${p.sales_name} · ` : ""}
                {format(new Date(p.created_at), "dd MMM yyyy")}
              </p>
              <div className="flex items-center gap-0.5">
                <Link
                  href={`/dashboard/prospects/${p.id}`}
                  className="icon-btn text-slate-500"
                  title="Open"
                >
                  <ExternalLink className="h-5 w-5" />
                </Link>
                <button
                  type="button"
                  className="icon-btn text-red-500 hover:bg-red-50 hover:text-red-700"
                  title="Delete"
                  disabled={deletingId === p.id}
                  onClick={() => setPending({ id: p.id, title: p.title })}
                >
                  {deletingId === p.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">PIC</th>
              <th className="px-4 py-3">Work / opportunity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Latest update</th>
              {showSales && <th className="px-4 py-3">Sales</th>}
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {prospects.map((p) => (
              <tr key={p.id} className="transition hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  {p.customer ? (
                    <Link
                      href={customerDetailPath({
                        id: p.customer.id,
                        slug: p.customer.slug,
                        name: p.customer.name,
                      })}
                      className={linkClass}
                    >
                      {p.customer.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatPicWithSalutation(p.pic_salutation, p.pic_name)}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/prospects/${p.id}`} className={linkClass}>
                    {p.title}
                  </Link>
                  {p.work_description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.work_description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ProspectStatusBadge value={p.status} />
                </td>
                <td className="max-w-[220px] px-4 py-3">
                  <p className="line-clamp-2 text-slate-600">{p.latest_update || "—"}</p>
                </td>
                {showSales && (
                  <td className="px-4 py-3 text-slate-700">{p.sales_name || "—"}</td>
                )}
                <td className="px-4 py-3 tabular-nums text-slate-600">
                  {format(new Date(p.created_at), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/dashboard/prospects/${p.id}`}
                      className="icon-btn text-slate-500"
                      title="Open"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="icon-btn text-red-500 hover:text-red-700"
                      title="Delete"
                      disabled={deletingId === p.id}
                      onClick={() => setPending({ id: p.id, title: p.title })}
                    >
                      {deletingId === p.id ? (
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
