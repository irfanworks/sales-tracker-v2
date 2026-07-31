import { ProspectForm } from "@/components/ProspectForm";
import { createClient } from "@/lib/supabase/server";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function NewProspectPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, customer_pics ( id, nama )")
    .order("name");

  const normalized = (customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    pics: Array.isArray(c.customer_pics)
      ? c.customer_pics.map((p: { id: string; nama: string | null }) => ({
          id: p.id,
          nama: p.nama,
        }))
      : [],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title="New Prospect"
        description="Record a pre-quote opportunity — customer, PIC, work, and first progress note."
      />
      <div className="card p-6">
        <ProspectForm customers={normalized} />
      </div>
    </div>
  );
}
