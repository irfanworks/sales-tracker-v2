"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

interface BdUpdateFormProps {
  userId: string;
  year: number;
  weekNumber: number;
  customerId: string | null;
  initialContent: string;
  customers: { id: string; name: string }[];
  updateId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function BdUpdateForm({
  userId,
  year,
  weekNumber,
  customerId,
  initialContent,
  customers,
  updateId,
  onClose,
  onSaved,
}: BdUpdateFormProps) {
  const router = useRouter();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerId ?? "");
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId.trim()) {
      setError("Please select a customer first.");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (updateId) {
      const { error: updateError } = await supabase
        .from("bd_weekly_updates")
        .update({
          customer_id: selectedCustomerId || null,
          content: content.trim() || null,
        })
        .eq("id", updateId);
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("bd_weekly_updates").insert({
        user_id: userId,
        year,
        week_number: weekNumber,
        customer_id: selectedCustomerId || null,
        content: content.trim() || null,
      });
      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onSaved();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="input-field"
          required
          disabled={loading}
        >
          <option value="">— Select customer —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Update Description</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input-field min-h-[100px] w-full resize-y"
          placeholder="Write BD activities in narrative bullet points..."
          rows={4}
          disabled={loading}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
