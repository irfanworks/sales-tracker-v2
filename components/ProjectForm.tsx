"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { OutcomeStatus, ProgressType, ProspectOption } from "@/lib/types/database";
import { projectDetailPath, projectSlugFor } from "@/lib/projectPaths";

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
    value: number | null;
    progress_type: ProgressType;
    outcome_status?: OutcomeStatus | null;
    prospect: ProspectOption;
    target_closing_at?: string | null;
  };
  backPath?: string;
}

export function ProjectForm({
  customers,
  progressTypes,
  prospectOptions,
  project,
  backPath,
}: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noQuote, setNoQuote] = useState(project?.no_quote ?? "");
  const [projectName, setProjectName] = useState(project?.project_name ?? "");
  const [customerId, setCustomerId] = useState(project?.customer_id ?? "");
  const [value, setValue] = useState(project?.value != null ? String(project.value) : "");
  const [progressType, setProgressType] = useState<ProgressType>(
    project?.progress_type ?? "Budgetary"
  );
  const [outcomeStatus, setOutcomeStatus] = useState<OutcomeStatus | "">(
    project?.outcome_status ?? ""
  );
  const [prospect, setProspect] = useState<ProspectOption>(
    project?.prospect ?? "Normal"
  );
  const [initialUpdate, setInitialUpdate] = useState("");
  const [targetClosingAt, setTargetClosingAt] = useState(
    project?.target_closing_at ? project.target_closing_at.slice(0, 10) : ""
  );

  const isBd = progressType === "BD";
  const valueRequired = !isBd;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numValue = value.trim() === "" ? null : parseFloat(value);
    if (valueRequired && (numValue == null || !Number.isFinite(numValue) || numValue <= 0)) {
      setError("Tender value is required for Budgetary and Tender projects.");
      return;
    }
    if (!valueRequired && numValue != null && (!Number.isFinite(numValue) || numValue < 0)) {
      setError("Tender value must be a valid non-negative number.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (project) {
      const slug = projectSlugFor({
        id: project.id,
        no_quote: noQuote,
        project_name: projectName,
      });

      const { error: updateError } = await supabase
        .from("projects")
        .update({
          no_quote: noQuote,
          project_name: projectName,
          customer_id: customerId,
          value: numValue,
          progress_type: progressType,
          outcome_status: outcomeStatus || null,
          prospect,
          target_closing_at: targetClosingAt || null,
          slug,
        })
        .eq("id", project.id);

      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push(backPath ?? projectDetailPath({ id: project.id, no_quote: noQuote, project_name: projectName, slug }));
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const trimmedUpdate = initialUpdate.trim();
      const { data: inserted, error: insertError } = await supabase
        .from("projects")
        .insert({
          no_quote: noQuote,
          project_name: projectName,
          customer_id: customerId,
          value: numValue,
          progress_type: progressType,
          outcome_status: null,
          prospect,
          weekly_update: trimmedUpdate || null,
          target_closing_at: targetClosingAt || null,
          sales_id: user.id,
        })
        .select("id")
        .single();

      if (insertError || !inserted?.id) {
        setLoading(false);
        setError(insertError?.message ?? "Failed to create project");
        return;
      }

      const slug = projectSlugFor({
        id: inserted.id,
        no_quote: noQuote,
        project_name: projectName,
      });

      await supabase.from("projects").update({ slug }).eq("id", inserted.id);

      if (trimmedUpdate) {
        const { error: updateHistoryError } = await supabase.from("project_updates").insert({
          project_id: inserted.id,
          content: trimmedUpdate,
          created_by: user.id,
        });
        if (updateHistoryError) {
          setLoading(false);
          setError(`Project created but initial update failed to save: ${updateHistoryError.message}`);
          router.push(projectDetailPath({ id: inserted.id, no_quote: noQuote, project_name: projectName, slug }));
          router.refresh();
          return;
        }
      }

      setLoading(false);
      router.push(projectDetailPath({ id: inserted.id, no_quote: noQuote, project_name: projectName, slug }));
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
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
          <label className="mb-1 block text-sm font-medium text-slate-700">No Quote</label>
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Project Name</label>
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
            Tender value (IDR)
            {!valueRequired && (
              <span className="ml-1 font-normal text-slate-500">(optional for BD)</span>
            )}
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input-field"
            placeholder={valueRequired ? "Required" : "Optional"}
            required={valueRequired}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Progress Type</label>
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
      {project && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Outcome status</label>
            <select
              value={outcomeStatus}
              onChange={(e) => setOutcomeStatus(e.target.value as OutcomeStatus | "")}
              className="input-field"
            >
              <option value="">None</option>
              <option value="Win">Win</option>
              <option value="Lose">Lose</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Win or Lose can only be set after the project is created.
            </p>
          </div>
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Prospect</label>
          <select
            value={prospect}
            onChange={(e) => setProspect(e.target.value as ProspectOption)}
            className="input-field"
          >
            {prospectOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Target closing date</label>
          <input
            type="date"
            value={targetClosingAt}
            onChange={(e) => setTargetClosingAt(e.target.value)}
            className="input-field w-full min-w-0"
            aria-label="Target closing date"
          />
          <p className="mt-1 text-xs text-slate-500">Can be updated over time</p>
        </div>
      </div>
      {!project && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Initial project update
          </label>
          <textarea
            value={initialUpdate}
            onChange={(e) => setInitialUpdate(e.target.value)}
            className="input-field min-h-[100px] resize-y"
            placeholder="First progress note — saved permanently in update history..."
            rows={4}
          />
          <p className="mt-1 text-xs text-slate-500">
            This becomes the first documented entry and is never removed when you add later updates.
          </p>
        </div>
      )}
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
            onClick={() => router.push(backPath ?? projectDetailPath(project))}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
