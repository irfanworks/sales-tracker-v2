import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerEditForm } from "@/components/CustomerEditForm";
import { SECTOR_OPTIONS } from "@/lib/types/database";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: customer } = await supabase.from("customers").select("name").eq("id", id).single();
  if (!customer) return { title: "Customer | Enercon Sales Tracker" };
  return { title: `${customer.name} | Enercon Sales Tracker` };
}

export default async function CustomerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, sector")
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  const { data: pics } = await supabase
    .from("customer_pics")
    .select("id, nama, email, no_hp, jabatan")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: true });

  const picsList = pics ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Link>
      </div>

      {picsList.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-6">
            <h2 className="text-lg font-medium text-slate-800">PIC</h2>
            <p className="mt-0.5 text-sm text-slate-600">Person in charge (saved)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/80">
                  <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Email</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Phone Number</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Position</th>
                </tr>
              </thead>
              <tbody>
                {picsList.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-700">{p.nama ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.email ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.no_hp ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.jabatan ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h1 className="mb-6 text-xl font-semibold text-slate-800">Edit customer</h1>
        <CustomerEditForm
          customerId={customer.id}
          initialName={customer.name}
          initialSector={customer.sector ?? ""}
          initialPics={(pics ?? []).map((p) => ({
            id: p.id,
            nama: p.nama ?? "",
            email: p.email ?? "",
            no_hp: p.no_hp ?? "",
            jabatan: p.jabatan ?? "",
          }))}
          sectorOptions={SECTOR_OPTIONS}
        />
      </div>
    </div>
  );
}
