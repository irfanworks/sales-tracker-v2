import { getSupabase } from "@/lib/auth";
import { CustomersTable } from "@/components/CustomersTable";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { ExportCustomersButton } from "@/components/ExportCustomersButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users } from "lucide-react";
import type { Customer, CustomerPic } from "@/lib/types/database";
import { slugWithId } from "@/lib/slugify";

export default async function CustomersPage() {
  const supabase = await getSupabase();
  const { data: customers, error } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      slug,
      sector,
      created_at,
      customer_pics ( id, nama )
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
    const slug = c.slug ?? slugWithId(c.name, c.id);
    return {
      id: c.id,
      name: c.name,
      slug,
      sector: c.sector ?? null,
      created_at: c.created_at,
      pics: pics.map(
        (p: { id?: string; nama: string | null }): CustomerPic => ({
          id: p.id,
          customer_id: c.id,
          nama: p.nama,
          email: null,
          no_hp: null,
          jabatan: null,
        })
      ),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Customers"
        description="Master data customer. Sector & PIC optional."
        actions={<ExportCustomersButton customers={normalized} />}
      />
      <div className="card-elevated p-5 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-slate-900 sm:text-lg">Add customer</h2>
        <AddCustomerForm
          existingCustomers={normalized.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            sector: c.sector,
          }))}
        />
      </div>
      <div className="table-shell">
        <CustomersTable customers={normalized} />
      </div>
    </div>
  );
}
