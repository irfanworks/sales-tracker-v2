"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Loader2 } from "lucide-react";

interface CustomerRow {
  id: string;
  name: string;
  sector?: string;
  created_at?: string;
}

interface CustomersTableProps {
  customers: CustomerRow[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus customer ini?")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setDeletingId(null);
    }
  }

  if (customers.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Belum ada customer.{" "}
        <a
          href="/customers/new"
          className="text-primary-600 hover:underline font-medium"
        >
          Tambah customer
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Nama
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Sector
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr
              key={c.id}
              className="border-b border-slate-100 hover:bg-slate-50/50"
            >
              <td className="px-4 py-3 text-slate-800 font-medium">{c.name}</td>
              <td className="px-4 py-3 text-slate-600 text-sm">{c.sector ?? "—"}</td>
              <td className="px-4 py-3 flex items-center gap-3">
                <a
                  href={`/customers/${c.id}/edit`}
                  className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-60"
                >
                  {deletingId === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
