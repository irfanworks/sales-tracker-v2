"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilePenLine, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PaymentTermLine } from "@/lib/types/database";
import { PaymentTermsEditor } from "@/components/PaymentTermsEditor";
import {
  formatNumberAsThousands,
  formatThousandsInput,
  parseThousandsInput,
} from "@/lib/formatThousands";
import {
  PRICE_VALIDITY_OPTIONS,
  emptyPaymentTerm,
  revisionSuffix,
  validatePaymentTerms,
  type PriceValidityDays,
} from "@/lib/quoteTerms";
import { projectDetailPath, projectSlugFor } from "@/lib/projectPaths";

function normalizeTerms(raw: PaymentTermLine[] | null | undefined): PaymentTermLine[] {
  if (!raw || raw.length === 0) return [emptyPaymentTerm()];
  return raw.map((t) => ({
    label: t.label ?? "",
    percent: Number(t.percent) || 0,
    is_custom: Boolean(t.is_custom),
  }));
}

export function QuoteRevisePanel({
  project,
}: {
  project: {
    id: string;
    no_quote: string;
    quote_base?: string | null;
    quote_revision?: number | null;
    project_name: string;
    value: number | null;
    price_validity_days?: number | null;
    delivery_weeks?: number | null;
    payment_terms?: PaymentTermLine[] | null;
    slug?: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const currentRev = project.quote_revision ?? 0;
  const atMax = currentRev >= 9;

  const [valueDisplay, setValueDisplay] = useState(
    formatNumberAsThousands(project.value ?? null)
  );
  const [priceValidity, setPriceValidity] = useState<PriceValidityDays | "">(
    project.price_validity_days === 60 || project.price_validity_days === 90
      ? project.price_validity_days
      : ""
  );
  const [deliveryWeeks, setDeliveryWeeks] = useState(
    project.delivery_weeks != null ? String(project.delivery_weeks) : ""
  );
  const [paymentTerms, setPaymentTerms] = useState(() =>
    normalizeTerms(project.payment_terms)
  );
  const [notes, setNotes] = useState("");

  function openPanel() {
    setError(null);
    setValueDisplay(formatNumberAsThousands(project.value ?? null));
    setPriceValidity(
      project.price_validity_days === 60 || project.price_validity_days === 90
        ? project.price_validity_days
        : ""
    );
    setDeliveryWeeks(project.delivery_weeks != null ? String(project.delivery_weeks) : "");
    setPaymentTerms(normalizeTerms(project.payment_terms));
    setNotes("");
    setOpen(true);
  }

  function submit() {
    setError(null);
    const numValue = parseThousandsInput(valueDisplay);
    if (numValue == null || numValue < 0) {
      setError("Enter a valid tender value.");
      return;
    }
    if (priceValidity !== 60 && priceValidity !== 90) {
      setError("Price validity is required (60 or 90 days).");
      return;
    }
    const weeks = Number(deliveryWeeks);
    if (!deliveryWeeks.trim() || !Number.isFinite(weeks) || weeks < 0) {
      setError("Delivery (weeks) is required.");
      return;
    }
    const termsError = validatePaymentTerms(paymentTerms);
    if (termsError) {
      setError(termsError);
      return;
    }

    const confirmed = window.confirm(
      `Confirm Revisi Quote?\n\nCurrent: ${project.no_quote}\nNext: …-${revisionSuffix(currentRev + 1)}\n\n` +
        "The current tender value and commercial terms will be saved to revision history, then replaced with your new inputs."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const supabase = createClient();
      const termsPayload = paymentTerms.map((t) => ({
        label: t.label.trim(),
        percent: Number(t.percent),
        is_custom: Boolean(t.is_custom),
      }));

      const { data, error: rpcError } = await supabase.rpc("revise_project_quote", {
        p_project_id: project.id,
        p_value: numValue,
        p_price_validity_days: priceValidity,
        p_delivery_weeks: weeks,
        p_payment_terms: termsPayload,
        p_notes: notes.trim() || null,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      const result = data as { no_quote?: string; quote_revision?: number } | null;
      const newNoQuote = result?.no_quote ?? project.no_quote;
      const slug = projectSlugFor({
        id: project.id,
        no_quote: newNoQuote,
        project_name: project.project_name,
      });
      await supabase.from("projects").update({ slug }).eq("id", project.id);

      setOpen(false);
      router.push(
        projectDetailPath({
          id: project.id,
          no_quote: newNoQuote,
          project_name: project.project_name,
          slug,
        })
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={openPanel}
        disabled={atMax}
        className="btn-secondary gap-2"
        title={atMax ? "Maximum revision R9 reached" : "Revise quote commercial terms"}
      >
        <FilePenLine className="h-4 w-4" />
        Revisi Quote
      </button>
      {atMax && (
        <p className="text-xs text-amber-700">Maximum revision R9 reached for this quote.</p>
      )}

      {open && (
        <div className="card-elevated space-y-4 border-cyan-200/80 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Revisi Quote</h3>
              <p className="mt-1 text-xs text-slate-500">
                Current <span className="font-mono font-medium text-slate-700">{project.no_quote}</span>
                {" → "}
                next suffix <span className="font-mono font-medium">{revisionSuffix(currentRev + 1)}</span>.
                Previous value & terms are kept in history for accuracy tracking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                New tender value (IDR)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={valueDisplay}
                onChange={(e) => setValueDisplay(formatThousandsInput(e.target.value))}
                className="input-field tabular-nums"
                placeholder="e.g. 1,500,000,000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Price validity</label>
              <select
                value={priceValidity}
                onChange={(e) =>
                  setPriceValidity(
                    e.target.value === "" ? "" : (Number(e.target.value) as PriceValidityDays)
                  )
                }
                className="input-field"
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
                Delivery (weeks)
              </label>
              <input
                type="number"
                min={0}
                value={deliveryWeeks}
                onChange={(e) => setDeliveryWeeks(e.target.value)}
                className="input-field tabular-nums"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                placeholder="Reason for revision"
              />
            </div>
          </div>

          <PaymentTermsEditor terms={paymentTerms} onChange={setPaymentTerms} disabled={pending} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={submit} className="btn-primary gap-2" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Revisi Quote
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary"
              disabled={pending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
