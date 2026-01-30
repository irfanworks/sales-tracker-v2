"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ProgressType, ProspectOption } from "@/lib/types/database";

interface Customer {
  id: string;
  name: string;
}

interface ProjectFormProps {
  customers: Customer[];
  progressTypes: readonly ProgressType[];
  prospectOptions: readonly ProspectOption[];
  project?: {
    id: string;
    no_quote: string;
    project_name: string;
    customer_id: string;
    value: number;
    progress_type: ProgressType;
    prospect: ProspectOption;
    weekly_update: string | null;
  };
}

export function ProjectForm({
  customers,
  progressTypes,
  prospectOptions,
  project,
}: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noQuote, setNoQuote] = useState(project?.no_quote ?? "");
  const [projectName, setProjectName] = useState(project?.project_name ?? "");
  const [customerId, setCustomerId] = useState(project?.customer_id ?? "");
  const [value, setValue] = useState(project?.value?.toString() ?? "");
  const [progressType, setProgressType] = useState<ProgressType>(
    project?.progress_type ?? "Budgetary"
  );
  const [prospect, setProspect] = useState<ProspectOption>(
    project?.prospect ?? "Normal"
  );
  const [weeklyUpdate, setWeeklyUpdate] = useState(project?.weekly_update ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const numValue = parseFloat(value) || 0;

    if (project) {
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          no_quote: noQuote,
          project_name: projectName,
          customer_id: customerId,
          value: numValue,
          progress_type: progressType,
          prospect,
          weekly_update: weeklyUpdate || null,
        })
        .eq("id", project.id);

      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push(`/dashboard/projects/${project.id}`);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      const { data: inserted, error: insertError } = await supabase
        .from("projects")
        .insert({
          no_quote: noQuote,
          project_name: projectName,
          customer_id: customerId,
          value: numValue,
          progress_type: progressType,
          prospect,
          weekly_update: weeklyUpdate || null,
          sales_id: user.id,
        })
        .select("id")
        .single();

      setLoading(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      if (inserted?.id) {
        router.push(`/dashboard/projects/${inserted.id}`);
      } else {
        router.push("/dashboard");
      }
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Customer
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            No Quote
          </label>
          <input
            type="text"
            value={noQuote}
            onChange={(e) => setNoQuote(e.target.value)}
            className="input-field"
            placeholder="e.g. QT-2024-001"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Project Name
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="input-field"
          placeholder="Project name"
          required
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Value
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input-field"
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Progress Type
          </label>
          <select
            value={progressType}
            onChange={(e) => setProgressType(e.target.value as ProgressType)}
            className="input-field"
          >
            {progressTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Prospect
        </label>
        <select
          value={prospect}
          onChange={(e) => setProspect(e.target.value as ProspectOption)}
          className="input-field max-w-xs"
        >
          {prospectOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Project Update
        </label>
        <textarea
          value={weeklyUpdate}
          onChange={(e) => setWeeklyUpdate(e.target.value)}
          className="input-field min-h-[100px] resize-y"
          placeholder="Latest progress update..."
          rows={4}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary gap-2" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {project ? "Save changes" : "Create project"}
        </button>
        {project && (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
