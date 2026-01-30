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
