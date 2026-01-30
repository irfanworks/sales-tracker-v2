import { createClient } from "@/lib/supabase/server";
import { CustomersTable } from "@/components/CustomersTable";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { ExportCustomersButton } from "@/components/ExportCustomersButton";
import { Users } from "lucide-react";
import type { Customer, CustomerPic } from "@/lib/types/database";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      sector,
      created_at,
      customer_pics ( id, nama, email, no_hp, jabatan )
    `)
    .order("name");

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading customers: {error.message}</p>
      </div>
    );
  }

  const normalized: (Customer & { pics: CustomerPic[] })[] = (customers ?? []).map((c) => {
    const pics = Array.isArray(c.customer_pics) ? c.customer_pics : [];
    return {
      id: c.id,
      name: c.name,
      sector: c.sector ?? null,
      created_at: c.created_at,
      pics: pics.map(
        (p: { id?: string; nama: string | null; email: string | null; no_hp: string | null; jabatan: string | null }): CustomerPic => ({
          id: p.id,
          customer_id: c.id,
          nama: p.nama,
          email: p.email,
          no_hp: p.no_hp,
          jabatan: p.jabatan,
        })
      ),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Customers</h1>
          <p className="mt-1 text-slate-600">Master data customer. Sector & PIC optional.</p>
        </div>
        <ExportCustomersButton customers={normalized} />
      </div>
      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-800">
          <Users className="h-5 w-5" />
          Add customer
        </h2>
        <AddCustomerForm />
      </div>
      <div className="card overflow-hidden">
        <CustomersTable customers={normalized} />
      </div>
    </div>
  );
}
