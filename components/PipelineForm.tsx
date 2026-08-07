"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import {
  OUTCOME_STATUSES,
  PIPELINE_TYPES,
  PIC_SALUTATIONS,
  formatPicWithSalutation,
  isPicSalutation,
  type OutcomeStatus,
  type PaymentTermLine,
  type PicSalutation,
  type ProgressType,
  type PipelineType,
  type ProspectOption,
} from "@/lib/types/database";
import { pipelineDetailPath, pipelineSlugFor } from "@/lib/pipelinePaths";
import {
  formatNumberAsThousands,
  formatThousandsInput,
  parseThousandsInput,
} from "@/lib/formatThousands";
import { PaymentTermsEditor } from "@/components/PaymentTermsEditor";
import { CustomerSelectAutocomplete } from "@/components/CustomerSelectAutocomplete";
import {
  PRICE_VALIDITY_OPTIONS,
  emptyPaymentTerm,
  isPriceValidityDays,
  validatePaymentTerms,
  type PriceValidityDays,
} from "@/lib/quoteTerms";
import { clipText, formatIdrShort, logSalesActivity } from "@/lib/salesActivity";

interface CustomerPicOption {
  id: string;
  nama: string | null;
}

interface Customer {
  id: string;
  name: string;
  pics?: CustomerPicOption[];
}

interface PipelineFormProps {
  customers: Customer[];
  progressTypes: readonly ProgressType[];
  prospectOptions: readonly ProspectOption[];
  project?: {
    id: string;
    no_quote: string;
    pipeline_name: string;
    customer_id: string;
    value: number | null;
    pipeline_type?: PipelineType;
    progress_type: ProgressType;
    outcome_status?: OutcomeStatus | null;
    prospect: ProspectOption;
    target_closing_at?: string | null;
    pic_name?: string | null;
    pic_salutation?: PicSalutation | null;
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

export function PipelineForm({
  customers,
  progressTypes,
  prospectOptions,
  project,
  backPath,
}: PipelineFormProps) {
  const router = useRouter();
  const isEdit = Boolean(project);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noQuote] = useState(project?.no_quote ?? "");
  const [projectName, setProjectName] = useState(project?.pipeline_name ?? "");
  const [customerId, setCustomerId] = useState(project?.customer_id ?? "");
  const [picName, setPicName] = useState(project?.pic_name ?? "");
  const [picSalutation, setPicSalutation] = useState<PicSalutation | "">(
    isPicSalutation(project?.pic_salutation) ? project.pic_salutation : ""
  );
  const [valueDisplay, setValueDisplay] = useState(
    formatNumberAsThousands(project?.value ?? null)
  );
  const [projectType, setPipelineType] = useState<PipelineType>(
    project?.pipeline_type ?? "Project"
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
    isPriceValidityDays(project?.price_validity_days) ? project.price_validity_days : ""
  );
  const [deliveryWeeks, setDeliveryWeeks] = useState(
    project?.delivery_weeks != null ? String(project.delivery_weeks) : ""
  );
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermLine[]>(() =>
    normalizePaymentTerms(project?.payment_terms)
  );
  const [fetchedPics, setFetchedPics] = useState<CustomerPicOption[] | null>(null);
  const [loadingPics, setLoadingPics] = useState(false);

  const commercialRequired = !isEdit;

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
    if (nextId === project?.customer_id) {
      setPicName(project?.pic_name ?? "");
      setPicSalutation(isPicSalutation(project?.pic_salutation) ? project.pic_salutation : "");
    } else {
      setPicName("");
      setPicSalutation("");
    }
  }

  function handleValueChange(raw: string) {
    setValueDisplay(formatThousandsInput(raw));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Customer is required. Search and select a customer from the list.");
      return;
    }
    if (!picName.trim()) {
      setError("PIC is required. Select a PIC from the chosen customer.");
      return;
    }
    if (!picSalutation) {
      setError("PIC salutation is required (Mr. / Mrs. / Ms.).");
      return;
    }

    const numValue = parseThousandsInput(valueDisplay);
    if (numValue == null || numValue <= 0) {
      setError("Tender value is required for Budgetary and Tender pipelines.");
      return;
    }

    let priceValidityDays: number | null = null;
    let deliveryWeeksNum: number | null = null;
    let paymentTermsPayload: PaymentTermLine[] = [];

    if (!isEdit) {
      if (commercialRequired) {
        if (!isPriceValidityDays(priceValidity)) {
          setError("Price validity is required (30, 60, or 90 days).");
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
        if (isPriceValidityDays(priceValidity)) priceValidityDays = priceValidity;
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const customerName = selectedCustomer?.name ?? "customer";

    if (project) {
      const slug = pipelineSlugFor({
        id: project.id,
        no_quote: project.no_quote,
        pipeline_name: projectName,
      });

      const changes: string[] = [];
      if (project.pipeline_name !== projectName) changes.push(`Name → ${projectName}`);
      if (project.customer_id !== customerId) changes.push(`Customer → ${customerName}`);
      const prevPic = formatPicWithSalutation(project.pic_salutation, project.pic_name);
      const nextPic = formatPicWithSalutation(picSalutation, picName.trim());
      if (prevPic !== nextPic) changes.push(`PIC → ${nextPic}`);
      if ((project.pipeline_type ?? "Project") !== projectType) {
        changes.push(`Type → ${projectType}`);
      }
      if (project.progress_type !== progressType) changes.push(`Progress → ${progressType}`);
      if ((project.outcome_status ?? "") !== (outcomeStatus || "")) {
        changes.push(`Outcome → ${outcomeStatus || "cleared"}`);
      }
      if (project.prospect !== prospect) changes.push(`Heat → ${prospect}`);
      const prevClosing = project.target_closing_at?.slice(0, 10) ?? "";
      if (prevClosing !== (targetClosingAt || "")) {
        changes.push(`Target closing → ${targetClosingAt || "cleared"}`);
      }

      const detailPath =
        backPath ??
        pipelineDetailPath({
          id: project.id,
          no_quote: project.no_quote,
          pipeline_name: projectName,
          slug,
        });

      // No-op save: leave quietly — do not clutter Sales Activity
      if (changes.length === 0) {
        setLoading(false);
        router.push(detailPath);
        router.refresh();
        return;
      }

      const { error: updateError } = await supabase
        .from("pipelines")
        .update({
          pipeline_name: projectName,
          customer_id: customerId,
          pic_name: picName.trim(),
          pic_salutation: picSalutation,
          pipeline_type: projectType,
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

      await logSalesActivity(supabase, {
        actorId: user.id,
        actionType: "pipeline_updated",
        entityType: "pipeline",
        entityId: project.id,
        entityLabel: `${project.no_quote} · ${projectName}`,
        summary: `Edited pipeline ${project.no_quote} “${projectName}”`,
        details: changes.join(" · "),
      });

      router.push(detailPath);
    } else {
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
        .from("pipelines")
        .insert({
          no_quote: alloc.no_quote,
          quote_base: alloc.quote_base,
          quote_revision: alloc.quote_revision ?? 0,
          pipeline_name: projectName,
          customer_id: customerId,
          pic_name: picName.trim(),
          pic_salutation: picSalutation,
          value: numValue,
          pipeline_type: projectType,
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
        setError(insertError?.message ?? "Failed to create pipeline");
        return;
      }

      const slug = pipelineSlugFor({
        id: inserted.id,
        no_quote: alloc.no_quote,
        pipeline_name: projectName,
      });

      await supabase.from("pipelines").update({ slug }).eq("id", inserted.id);

      if (trimmedUpdate) {
        const { error: updateHistoryError } = await supabase.from("pipeline_updates").insert({
          pipeline_id: inserted.id,
          content: trimmedUpdate,
          created_by: user.id,
        });
        if (updateHistoryError) {
          setLoading(false);
          setError(
            `Pipeline created but initial update failed to save: ${updateHistoryError.message}`
          );
          router.push(
            pipelineDetailPath({
              id: inserted.id,
              no_quote: alloc.no_quote,
              pipeline_name: projectName,
              slug,
            })
          );
          router.refresh();
          return;
        }
      }

      await logSalesActivity(supabase, {
        actorId: user.id,
        actionType: "pipeline_created",
        entityType: "pipeline",
        entityId: inserted.id,
        entityLabel: `${alloc.no_quote} · ${projectName}`,
        summary: `Created pipeline ${alloc.no_quote} “${projectName}” for ${customerName} (${formatIdrShort(numValue)}, ${progressType})`,
        details: trimmedUpdate ? `Initial note: ${clipText(trimmedUpdate)}` : null,
      });

      setLoading(false);
      router.push(
        pipelineDetailPath({
          id: inserted.id,
          no_quote: alloc.no_quote,
          pipeline_name: projectName,
          slug,
        })
      );
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="pipeline-form">
      <div className="pipeline-form-section">
        <div className="pipeline-form-grid">
          <div className="pipeline-field">
            <label className="pipeline-label">
              Customer
              <span className="pipeline-required" aria-hidden title="Required" />
              <span className="sr-only"> (required)</span>
            </label>
            <CustomerSelectAutocomplete
              customers={customers.map((c) => ({ id: c.id, name: c.name }))}
              valueId={customerId}
              onSelect={handleCustomerChange}
              required
              placeholder="Search customer by name…"
            />
            {!customerId && (
              <p className="pipeline-hint">Type to filter, then pick a customer from the list.</p>
            )}
          </div>
          <div className="pipeline-field">
            <label className="pipeline-label">
              PIC
              <span className="pipeline-required" aria-hidden title="Required" />
              <span className="sr-only"> (required)</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-[minmax(5.5rem,7rem)_minmax(0,1fr)]">
              <select
                value={picSalutation}
                onChange={(e) =>
                  setPicSalutation(isPicSalutation(e.target.value) ? e.target.value : "")
                }
                className="input-field"
                required
                aria-label="PIC salutation"
              >
                <option value="">Title</option>
                {PIC_SALUTATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
            </div>
            <p className="pipeline-hint">Choose salutation and PIC saved for this customer.</p>
          </div>
        </div>

        <div className="pipeline-form-grid">
          <div className="pipeline-field">
            <label className="pipeline-label">No Quote</label>
            {isEdit ? (
              <div className="pipeline-readonly">
                <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <input
                  type="text"
                  value={noQuote}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[13px] text-slate-600 outline-none"
                  readOnly
                  disabled
                />
              </div>
            ) : (
              <div className="pipeline-readonly">
                <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span>Assigned on save (EI-YYXXX-00)</span>
              </div>
            )}
            <p className="pipeline-hint">
              {isEdit
                ? "System-generated. Use Revisi Quote on the detail page to bump revision."
                : "Format EI-26XXX-00 — allocated automatically when you create the pipeline."}
            </p>
          </div>
          <div className="pipeline-field">
            <label className="pipeline-label">
              Pipeline Name
              <span className="pipeline-required" aria-hidden title="Required" />
              <span className="sr-only"> (required)</span>
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
        </div>

        <div className="pipeline-form-grid">
          <div className="pipeline-field">
            <label className="pipeline-label">Type</label>
            <select
              value={projectType}
              onChange={(e) => setPipelineType(e.target.value as PipelineType)}
              className="input-field"
              required
            >
              {PIPELINE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="pipeline-field">
            <label className="pipeline-label">Progress Type</label>
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

        <div className="pipeline-form-grid">
          <div className="pipeline-field">
            <label className="pipeline-label">
              Tender value
              <span className="pipeline-required" aria-hidden title="Required" />
              <span className="sr-only"> (required)</span>
            </label>
            <div className="pipeline-currency-wrap">
              <span className="pipeline-currency-affix">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={valueDisplay}
                onChange={(e) => handleValueChange(e.target.value)}
                className="input-field tabular-nums"
                placeholder="e.g. 1,500,000,000"
                required
                disabled={isEdit}
                readOnly={isEdit}
              />
            </div>
            <p className="pipeline-hint">
              {isEdit
                ? "To change tender value, use Revisi Quote on the detail page (tracked history)."
                : "Auto thousand separators (e.g. 1,000,000) to avoid typing mistakes."}
            </p>
          </div>
          <div className="pipeline-field">
            <label className="pipeline-label">Prospect</label>
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
      </div>

      {!isEdit && (
        <div className="pipeline-commercial">
          <div>
            <p className="pipeline-commercial-title">Commercial terms</p>
            <p className="pipeline-commercial-sub">
              Required for Budgetary / Tender. Recorded with the quote for revision tracking.
            </p>
          </div>
          <div className="pipeline-form-grid !gap-y-5">
            <div className="pipeline-field">
              <label className="pipeline-label">
                Price validity
                {commercialRequired && (
                  <>
                    <span className="pipeline-required" aria-hidden title="Required" />
                    <span className="sr-only"> (required)</span>
                  </>
                )}
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
            <div className="pipeline-field">
              <label className="pipeline-label">
                Delivery (weeks)
                {commercialRequired && (
                  <>
                    <span className="pipeline-required" aria-hidden title="Required" />
                    <span className="sr-only"> (required)</span>
                  </>
                )}
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
        <div className="pipeline-form-grid">
          <div className="pipeline-field">
            <label className="pipeline-label">Outcome status</label>
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
            <p className="pipeline-hint">
              Win, Lose, or On Hold — On Hold is excluded from Quoted Pipeline value.
            </p>
          </div>
          <div className="pipeline-field">
            <label className="pipeline-label">Target closing date</label>
            <input
              type="date"
              value={targetClosingAt}
              onChange={(e) => setTargetClosingAt(e.target.value)}
              className="input-field w-full min-w-0"
              aria-label="Target closing date"
            />
            <p className="pipeline-hint">Can be updated over time</p>
          </div>
        </div>
      )}

      {!isEdit && (
        <div className="pipeline-form-section">
          <div className="pipeline-field w-full min-w-0 md:max-w-xs">
            <label className="pipeline-label">Target closing date</label>
            <input
              type="date"
              value={targetClosingAt}
              onChange={(e) => setTargetClosingAt(e.target.value)}
              className="input-field w-full min-w-0"
              aria-label="Target closing date"
            />
            <p className="pipeline-hint">Can be updated over time</p>
          </div>

          <div className="pipeline-field">
            <label className="pipeline-label">Initial pipeline update</label>
            <textarea
              value={initialUpdate}
              onChange={(e) => setInitialUpdate(e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="First progress note — saved permanently in update history..."
              rows={4}
            />
            <p className="pipeline-hint">
              This becomes the first documented entry and is never removed when you add later
              updates.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p
          className="rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="pipeline-actions">
        <button type="submit" className="btn-primary gap-2" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create pipeline"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => router.push(backPath ?? pipelineDetailPath(project!))}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
