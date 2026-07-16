"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  OUTCOME_STATUSES,
  PROJECT_TYPES,
  type OutcomeStatus,
  type PaymentTermLine,
  type ProgressType,
  type ProjectType,
  type ProspectOption,
} from "@/lib/types/database";
import { projectDetailPath, projectSlugFor } from "@/lib/projectPaths";
import {
  formatNumberAsThousands,
  formatThousandsInput,
  parseThousandsInput,
} from "@/lib/formatThousands";
import { PaymentTermsEditor } from "@/components/PaymentTermsEditor";
import {
  PRICE_VALIDITY_OPTIONS,
  emptyPaymentTerm,
  validatePaymentTerms,
  type PriceValidityDays,
} from "@/lib/quoteTerms";

interface CustomerPicOption {
  id: string;
  nama: string | null;
}

interface Customer {
  id: string;
  name: string;
  pics?: CustomerPicOption[];
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
    project_type?: ProjectType;
    progress_type: ProgressType;
    outcome_status?: OutcomeStatus | null;
    prospect: ProspectOption;
    target_closing_at?: string | null;
    pic_name?: string | null;
    price_validity_days?: number | null;
    delivery_weeks?: number | null;
    payment_terms?: PaymentTermLine[] | null;
  };
  backPath?: string;
}

function normalizePaymentTerms(raw: PaymentTermLine[] | null | undefined): PaymentTermLine[] {
  if (!raw || raw.length === 0) return [emptyPaymentTerm()];
  return raw.map((t) => ({
    label: t.label ?? "",
    percent: Number(t.percent) || 0,
    is_custom: Boolean(t.is_custom),
  }));
}

export function ProjectForm({
  customers,
  progressTypes,
  prospectOptions,
  project,
  backPath,
}: ProjectFormProps) {
  const router = useRouter();
  const isEdit = Boolean(project);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noQuote] = useState(project?.no_quote ?? "");
  const [projectName, setProjectName] = useState(project?.project_name ?? "");
  const [customerId, setCustomerId] = useState(project?.customer_id ?? "");
  const [picName, setPicName] = useState(project?.pic_name ?? "");
  const [valueDisplay, setValueDisplay] = useState(
    formatNumberAsThousands(project?.value ?? null)
  );
  const [projectType, setProjectType] = useState<ProjectType>(
    project?.project_type ?? "Project"
  );
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
  const [priceValidity, setPriceValidity] = useState<PriceValidityDays | "">(
    project?.price_validity_days === 60 || project?.price_validity_days === 90
      ? project.price_validity_days
      : ""
  );
  const [deliveryWeeks, setDeliveryWeeks] = useState(
    project?.delivery_weeks != null ? String(project.delivery_weeks) : ""
  );
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermLine[]>(() =>
    normalizePaymentTerms(project?.payment_terms)
  );
  const [fetchedPics, setFetchedPics] = useState<CustomerPicOption[] | null>(null);
  const [loadingPics, setLoadingPics] = useState(false);

  const isBd = progressType === "BD";
  const valueRequired = !isBd;
  const commercialRequired = !isBd && !isEdit;

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) ?? null,
    [customers, customerId]
  );

  const picOptions = useMemo(() => {
    const fromCustomer = selectedCustomer?.pics;
    if (fromCustomer && fromCustomer.length > 0) {
      return fromCustomer.filter((p) => p.nama?.trim());
    }
    return (fetchedPics ?? []).filter((p) => p.nama?.trim());
  }, [selectedCustomer, fetchedPics]);

  useEffect(() => {
    if (!customerId) {
      setFetchedPics(null);
      return;
    }

    const fromProps = customers.find((c) => c.id === customerId)?.pics;
    if (fromProps) {
      setFetchedPics(null);
      return;
    }

    let cancelled = false;
    async function loadPics() {
      setLoadingPics(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("customer_pics")
        .select("id, nama")
        .eq("customer_id", customerId)
        .order("nama");
      if (!cancelled) {
        setFetchedPics(data ?? []);
        setLoadingPics(false);
      }
    }
    void loadPics();
    return () => {
      cancelled = true;
    };
  }, [customerId, customers]);

  function handleCustomerChange(nextId: string) {
    setCustomerId(nextId);
    setPicName(nextId === project?.customer_id ? (project?.pic_name ?? "") : "");
  }

  function handleValueChange(raw: string) {
    setValueDisplay(formatThousandsInput(raw));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!picName.trim()) {
      setError("PIC is required. Select a PIC from the chosen customer.");
      return;
    }

    const numValue = parseThousandsInput(valueDisplay);
    if (valueRequired && (numValue == null || numValue <= 0)) {
      setError("Tender value is required for Budgetary and Tender projects.");
      return;
    }
    if (!valueRequired && numValue != null && numValue < 0) {
      setError("Tender value must be a valid non-negative number.");
      return;
    }

    let priceValidityDays: number | null = null;
    let deliveryWeeksNum: number | null = null;
    let paymentTermsPayload: PaymentTermLine[] = [];

    if (!isEdit) {
      if (commercialRequired) {
        if (priceValidity !== 60 && priceValidity !== 90) {
          setError("Price validity is required (60 or 90 days).");
          return;
        }
        const weeks = Number(deliveryWeeks);
        if (!deliveryWeeks.trim() || !Number.isFinite(weeks) || weeks < 0) {
          setError("Delivery (weeks) is required and must be a non-negative number.");
          return;
        }
        const termsError = validatePaymentTerms(paymentTerms);
        if (termsError) {
          setError(termsError);
          return;
        }
        priceValidityDays = priceValidity;
        deliveryWeeksNum = weeks;
        paymentTermsPayload = paymentTerms.map((t) => ({
          label: t.label.trim(),
          percent: Number(t.percent),
          is_custom: Boolean(t.is_custom) || t.label === "Custom",
        }));
      } else if (deliveryWeeks.trim()) {
        const weeks = Number(deliveryWeeks);
        if (!Number.isFinite(weeks) || weeks < 0) {
          setError("Delivery (weeks) must be a non-negative number.");
          return;
        }
        deliveryWeeksNum = weeks;
        if (priceValidity === 60 || priceValidity === 90) priceValidityDays = priceValidity;
        if (paymentTerms.some((t) => t.label.trim() && t.percent > 0)) {
          const termsError = validatePaymentTerms(paymentTerms);
          if (termsError) {
            setError(termsError);
            return;
          }
          paymentTermsPayload = paymentTerms.map((t) => ({
            label: t.label.trim(),
            percent: Number(t.percent),
            is_custom: Boolean(t.is_custom),
          }));
        }
      }
    }

    setLoading(true);
    const supabase = createClient();

    if (project) {
      const slug = projectSlugFor({
        id: project.id,
        no_quote: project.no_quote,
        project_name: projectName,
      });

      const { error: updateError } = await supabase
        .from("projects")
        .update({
          project_name: projectName,
          customer_id: customerId,
          pic_name: picName.trim(),
          project_type: projectType,
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
      router.push(
        backPath ??
          projectDetailPath({
            id: project.id,
            no_quote: project.no_quote,
            project_name: projectName,
            slug,
          })
      );
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const { data: allocated, error: allocError } = await supabase.rpc(
        "allocate_next_quote_number"
      );
      if (allocError || !allocated) {
        setLoading(false);
        setError(allocError?.message ?? "Failed to allocate quote number.");
        return;
      }

      const alloc = allocated as {
        quote_base: string;
        no_quote: string;
        quote_revision: number;
      };

      const trimmedUpdate = initialUpdate.trim();
      const { data: inserted, error: insertError } = await supabase
        .from("projects")
        .insert({
          no_quote: alloc.no_quote,
          quote_base: alloc.quote_base,
          quote_revision: alloc.quote_revision ?? 0,
          project_name: projectName,
          customer_id: customerId,
          pic_name: picName.trim(),
          value: numValue,
          project_type: projectType,
          progress_type: progressType,
          outcome_status: null,
          prospect,
          status: "Open",
          weekly_update: trimmedUpdate || null,
          target_closing_at: targetClosingAt || null,
          price_validity_days: priceValidityDays,
          delivery_weeks: deliveryWeeksNum,
          payment_terms: paymentTermsPayload,
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
        no_quote: alloc.no_quote,
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
          setError(
            `Project created but initial update failed to save: ${updateHistoryError.message}`
          );
          router.push(
            projectDetailPath({
              id: inserted.id,
              no_quote: alloc.no_quote,
              project_name: projectName,
              slug,
            })
          );
          router.refresh();
          return;
        }
      }

      setLoading(false);
      router.push(
        projectDetailPath({
          id: inserted.id,
          no_quote: alloc.no_quote,
          project_name: projectName,
          slug,
        })
      );
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
            onChange={(e) => handleCustomerChange(e.target.value)}
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
            PIC <span className="text-red-600">*</span>
          </label>
          <select
            value={picName}
            onChange={(e) => setPicName(e.target.value)}
            className="input-field"
            required
            disabled={!customerId || loadingPics}
          >
            <option value="">
              {!customerId
                ? "Select customer first"
                : loadingPics
                  ? "Loading PICs…"
                  : picOptions.length === 0
                    ? "No PIC — add one on Customer first"
                    : "Select PIC"}
            </option>
            {picOptions.map((p) => (
              <option key={p.id} value={p.nama ?? ""}>
                {p.nama}
              </option>
            ))}
            {project?.pic_name &&
              !picOptions.some((p) => p.nama === project.pic_name) && (
                <option value={project.pic_name}>{project.pic_name} (saved)</option>
              )}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Choose from PICs saved for this customer (name only).
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">No Quote</label>
          {isEdit ? (
            <input
              type="text"
              value={noQuote}
              className="input-field bg-slate-50 font-mono"
              readOnly
              disabled
            />
          ) : (
            <div className="input-field flex items-center bg-slate-50 font-mono text-slate-500">
              Assigned on save (EI-YYXXX-00)
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {isEdit
              ? "System-generated. Use Revisi Quote on the detail page to bump revision."
              : "Format EI-26XXX-00 — allocated automatically when you create the project."}
          </p>
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
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as ProjectType)}
            className="input-field"
            required
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tender value (IDR)
            {!valueRequired && (
              <span className="ml-1 font-normal text-slate-500">(optional for BD)</span>
            )}
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={valueDisplay}
            onChange={(e) => handleValueChange(e.target.value)}
            className="input-field tabular-nums"
            placeholder={valueRequired ? "e.g. 1,500,000,000" : "Optional"}
            required={valueRequired}
            disabled={isEdit}
            readOnly={isEdit}
          />
          <p className="mt-1 text-xs text-slate-500">
            {isEdit
              ? "To change tender value, use Revisi Quote on the detail page (tracked history)."
              : "Auto thousand separators (e.g. 1,000,000) to avoid typing mistakes."}
          </p>
        </div>
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
      </div>

      {!isEdit && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <div>
            <p className="text-sm font-semibold text-slate-800">Commercial terms</p>
            <p className="text-xs text-slate-500">
              Required for Budgetary / Tender. Recorded with the quote for revision tracking.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Price validity {commercialRequired && <span className="text-red-600">*</span>}
              </label>
              <select
                value={priceValidity}
                onChange={(e) =>
                  setPriceValidity(
                    e.target.value === "" ? "" : (Number(e.target.value) as PriceValidityDays)
                  )
                }
                className="input-field"
                required={commercialRequired}
              >
                <option value="">Select days</option>
                {PRICE_VALIDITY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Delivery (weeks) {commercialRequired && <span className="text-red-600">*</span>}
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={deliveryWeeks}
                onChange={(e) => setDeliveryWeeks(e.target.value)}
                className="input-field tabular-nums"
                placeholder="e.g. 12"
                required={commercialRequired}
              />
            </div>
          </div>
          <PaymentTermsEditor terms={paymentTerms} onChange={setPaymentTerms} />
        </div>
      )}

      {isEdit && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Outcome status</label>
            <select
              value={outcomeStatus}
              onChange={(e) => setOutcomeStatus(e.target.value as OutcomeStatus | "")}
              className="input-field"
            >
              <option value="">None</option>
              {OUTCOME_STATUSES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Win, Lose, or On Hold — On Hold is excluded from Quoted Project value.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Target closing date
            </label>
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
      )}

      {!isEdit && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Target closing date</label>
          <input
            type="date"
            value={targetClosingAt}
            onChange={(e) => setTargetClosingAt(e.target.value)}
            className="input-field w-full min-w-0 max-w-xs"
            aria-label="Target closing date"
          />
          <p className="mt-1 text-xs text-slate-500">Can be updated over time</p>
        </div>
      )}

      {!isEdit && (
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
          {isEdit ? "Save changes" : "Create project"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => router.push(backPath ?? projectDetailPath(project!))}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
