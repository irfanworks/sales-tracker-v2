import { ProspectForm } from "@/components/ProspectForm";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewProspectPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        title="New Prospect"
        description="Record a pre-quote opportunity — customer, PIC, work, and first progress note."
      />
      <div className="card p-6">
        <ProspectForm />
      </div>
    </div>
  );
}
