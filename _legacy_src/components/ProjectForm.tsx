"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { ProgressType, ProspectType } from "@/types/database";

interface CustomerOption {
  id: string;
  name: string;
}

interface ProjectFormProps {
  customers: CustomerOption[];
  defaultValues?: {
    id: string;
    no_quote: string;
    project_name: string;
    customer_id: string;
    value: number;
    progress_type: ProgressType;
    prospect: ProspectType;
    created_by?: string | null;
  };
}

const PROGRESS_TYPES: ProgressType[] = ["Budgetary", "Tender", "Win", "Loss"];
const PROSPECT_TYPES: ProspectType[] = ["Hot Prospect", "Normal"];

async function getDisplayName(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const name =
    profile?.full_name?.trim() ||
    (user.user_metadata?.full_name as string)?.trim() ||
    "";
  return name || user.email || "";
}

export function ProjectForm({ customers, defaultValues }: ProjectFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [noQuote, setNoQuote] = useState(defaultValues?.no_quote ?? "");
  const [projectName, setProjectName] = useState(
    defaultValues?.project_name ?? ""
  );
  const [customerId, setCustomerId] = useState(
    defaultValues?.customer_id ?? (customers[0]?.id ?? "")
  );
  const [value, setValue] = useState(
    defaultValues?.value?.toString() ?? ""
  );
  const [progressType, setProgressType] = useState<ProgressType>(
    defaultValues?.progress_type ?? "Budgetary"
  );
  const [prospect, setProspect] = useState<ProspectType>(
    defaultValues?.prospect ?? "Normal"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const numValue = parseFloat(value.replace(/,/g, ""));
    if (isNaN(numValue) || numValue < 0) {
      setError("Value harus angka positif.");
      setLoading(false);
      return;
    }

    const displayName = await getDisplayName(supabase);

    try {
      if (defaultValues?.id) {
        const updatePayload: Record<string, unknown> = {
          no_quote: noQuote,
          project_name: projectName,
          customer_id: customerId,
          value: numValue,
          progress_type: progressType,
          prospect,
        };
        if (defaultValues.created_by == null) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            updatePayload.created_by = user.id;
            updatePayload.created_by_name = displayName || user.email || "";
          }
        }
        const { error: updateError } = await supabase
          .from("projects")
          .update(updatePayload)
          .eq("id", defaultValues.id);

        if (updateError) throw updateError;
        router.push("/dashboard");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const insertPayload: Record<string, unknown> = {
          no_quote: noQuote,
          project_name: projectName,
          customer_id: customerId,
          value: numValue,
          progress_type: progressType,
          prospect,
        };
        if (user?.id) {
          insertPayload.created_by = user.id;
          insertPayload.created_by_name = displayName || user.email || "";
        }
        const { error: insertError } = await supabase
          .from("projects")
          .insert(insertPayload);

        if (insertError) throw insertError;
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Gagal menyimpan project.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="customer" className="block text-sm font-medium text-slate-700 mb-1.5">
          Customer
        </label>
        <select
          id="customer"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Pilih customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="no_quote" className="block text-sm font-medium text-slate-700 mb-1.5">
          No Quote
        </label>
        <input
          id="no_quote"
          type="text"
          value={noQuote}
          onChange={(e) => setNoQuote(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Contoh: Q-2024-001"
        />
      </div>

      <div>
        <label htmlFor="project_name" className="block text-sm font-medium text-slate-700 mb-1.5">
          Project
        </label>
        <input
          id="project_name"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Nama project"
        />
      </div>

      <div>
        <label htmlFor="value" className="block text-sm font-medium text-slate-700 mb-1.5">
          Value
        </label>
        <input
          id="value"
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9,]/g, ""))}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="progress_type" className="block text-sm font-medium text-slate-700 mb-1.5">
            Progress Type
          </label>
          <select
            id="progress_type"
            value={progressType}
            onChange={(e) => setProgressType(e.target.value as ProgressType)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {PROGRESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prospect" className="block text-sm font-medium text-slate-700 mb-1.5">
            Prospect
          </label>
          <select
            id="prospect"
            value={prospect}
            onChange={(e) => setProspect(e.target.value as ProspectType)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {PROSPECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary-700 text-white py-2.5 px-5 font-medium hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {defaultValues?.id ? "Simpan Perubahan" : "Simpan Project"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 text-slate-700 py-2.5 px-5 font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
