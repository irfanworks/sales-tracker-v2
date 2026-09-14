"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import {
  PIPELINE_TYPES,
  PIC_SALUTATIONS,
  isPicSalutation,
  type PaymentTermLine,
  type PicSalutation,
  type PipelineType,
} from "@/lib/types/database";
import {
  SALES_STAGES,
  isSalesStage,
  isTerminalWinLose,
  needsOutcomeReason,
  type SalesStage,
} from "@/lib/salesStage";
import { LostReasonFields } from "@/components/LostReasonFields";
import {
  validateLostReasonInput,
  type LostReasonCategory,
} from "@/lib/lostAnalysis";
import {
  createPipelineAction,
  updatePipelineAction,
} from "@/app/dashboard/pipeline/actions";
import { pipelineDetailPath } from "@/lib/pipelinePaths";
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

interface CustomerPicOption {
  id: string;
  nama: string | null;
}

interface PipelineFormProps {
  /** Optional seed for edit mode — avoid shipping the full customer master list. */
  seedCustomer?: {
    id: string;
    name: string;
    pics?: CustomerPicOption[];
  } | null;
  project?: {
    id: string;
    no_quote: string;
    pipeline_name: string;
    customer_id: string;
    value: number | null;
    pipeline_type?: PipelineType;
    sales_stage: SalesStage;
    sales_stage_changed_at?: string | null;
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
  seedCustomer,
  project,
  backPath,
}: PipelineFormProps) {
  const router = useRouter();
  const isEdit = Boolean(project);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noQuote] = useState(project?.no_quote ?? "");
  const [projectName, setProjectName] = useState(project?.pipeline_name ?? "");
  const [customerId, setCustomerId] = useState(project?.customer_id ?? seedCustomer?.id ?? "");
  const [customerName, setCustomerName] = useState(seedCustomer?.name ?? "");
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
  const [salesStage, setSalesStage] = useState<SalesStage>(
    isSalesStage(project?.sales_stage) ? project.sales_stage : "Identified"
  );
  const [lostCategory, setLostCategory] = useState<LostReasonCategory | "">("");
  const [lostNotes, setLostNotes] = useState("");
  const [reopenReason, setReopenReason] = useState("");
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
  const [fetchedPics, setFetchedPics] = useState<CustomerPicOption[] | null>(
    seedCustomer?.pics ?? null
  );
  const [loadingPics, setLoadingPics] = useState(false);

  const commercialRequired = !isEdit;

  const stageChangedLabel = useMemo(() => {
    if (!isEdit || !project?.sales_stage_changed_at) return null;
    const parsed = new Date(project.sales_stage_changed_at);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [isEdit, project?.sales_stage_changed_at]);

  const picOptions = useMemo(
    () => (fetchedPics ?? []).filter((p) => p.nama?.trim()),
    [fetchedPics]
  );

  useEffect(() => {
    if (!customerId) {
      setFetchedPics(null);
      return;
    }

    if (seedCustomer?.id === customerId && seedCustomer.pics) {
      setFetchedPics(seedCustomer.pics);
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
  }, [customerId, seedCustomer]);

  function handleCustomerChange(next: { id: string; name: string } | null) {
    setCustomerId(next?.id ?? "");
    setCustomerName(next?.name ?? "");
    if (next?.id === project?.customer_id) {
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

    const resolvedCustomerName = customerName.trim() || "customer";

    const stageChanged = !project || project.sales_stage !== salesStage;
    const reopening = Boolean(
      project &&
        stageChanged &&
        isTerminalWinLose(project.sales_stage) &&
        !isTerminalWinLose(salesStage)
    );
    const capturingLost = stageChanged && needsOutcomeReason(salesStage);

    if (reopening && !reopenReason.trim()) {
      setError(`Reopening a ${project?.sales_stage} pipeline needs a reason.`);
      return;
    }
    if (capturingLost) {
      const invalid = validateLostReasonInput({
        category: lostCategory,
        notes: lostNotes,
      });
      if (invalid) {
        setError(invalid);
        return;
      }
    }

    if (project) {
      setLoading(true);
      const result = await updatePipelineAction({
        id: project.id,
        no_quote: project.no_quote,
        previous: {
          pipeline_name: project.pipeline_name,
          customer_id: project.customer_id,
          pic_name: project.pic_name,
          pic_salutation: project.pic_salutation,
          pipeline_type: project.pipeline_type,
          sales_stage: project.sales_stage,
          target_closing_at: project.target_closing_at,
        },
        pipeline_name: projectName,
        customer_id: customerId,
        customer_name: resolvedCustomerName,
        pic_name: picName.trim(),
        pic_salutation: picSalutation,
        pipeline_type: projectType,
        sales_stage: salesStage,
        stage_reason: reopening ? reopenReason.trim() : lostCategory || null,
        stage_reason_category: capturingLost ? lostCategory || null : null,
        stage_note: capturingLost ? lostNotes.trim() : null,
        target_closing_at: targetClosingAt,
        backPath,
      });

      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.redirectTo);
    } else {
      if (!isPicSalutation(picSalutation)) {
        setError("PIC salutation is required (Mr. / Mrs. / Ms.).");
        return;
      }

      setLoading(true);
      const result = await createPipelineAction({
        pipeline_name: projectName,
        customer_id: customerId,
        customer_name: resolvedCustomerName,
        pic_name: picName.trim(),
        pic_salutation: picSalutation,
        value: numValue,
        pipeline_type: projectType,
        sales_stage: salesStage,
        stage_reason_category: capturingLost ? lostCategory || null : null,
        stage_note: capturingLost ? lostNotes.trim() : null,
        target_closing_at: targetClosingAt,
        initial_update: initialUpdate.trim(),
        price_validity_days: priceValidityDays,
        delivery_weeks: deliveryWeeksNum,
        payment_terms: paymentTermsPayload,
      });

      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.redirectTo);
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
              valueId={customerId}
              valueLabel={customerName}
              onSelect={handleCustomerChange}
              required
              placeholder="Search customer by name…"
            />
            {!customerId && (
              <p className="pipeline-hint">Type to search, then pick a customer from the list.</p>
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
            <label className="pipeline-label">Sales Stage</label>
            <select
              value={salesStage}
              onChange={(e) => setSalesStage(e.target.value as SalesStage)}
              className="input-field"
            >
              {SALES_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="pipeline-hint">
              {stageChangedLabel
                ? `Win and Lose close the pipeline automatically. Stage last changed ${stageChangedLabel}.`
                : "Win and Lose close the pipeline automatically; Lose and On Hold are excluded from Quoted Pipeline value."}
            </p>
            {needsOutcomeReason(salesStage) &&
              (!project || project.sales_stage !== salesStage) && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <LostReasonFields
                    category={lostCategory}
                    notes={lostNotes}
                    onCategoryChange={setLostCategory}
                    onNotesChange={setLostNotes}
                    disabled={loading}
                  />
                </div>
              )}
            {project &&
              isTerminalWinLose(project.sales_stage) &&
              !isTerminalWinLose(salesStage) && (
                <div className="mt-3">
                  <label className="pipeline-label">
                    Reopen reason
                    <span className="pipeline-required" aria-hidden title="Required" />
                  </label>
                  <textarea
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    className="input-field min-h-[4.5rem] resize-y"
                    rows={3}
                    placeholder={`Why is this moving out of ${project.sales_stage}?`}
                  />
                </div>
              )}
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
