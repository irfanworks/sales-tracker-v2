"use client";

import { Plus, Trash2 } from "lucide-react";
import type { PaymentTermLine } from "@/lib/types/database";
import {
  PAYMENT_TERM_PRESETS,
  emptyPaymentTerm,
  paymentTermsTotal,
} from "@/lib/quoteTerms";

export function PaymentTermsEditor({
  terms,
  onChange,
  disabled = false,
}: {
  terms: PaymentTermLine[];
  onChange: (next: PaymentTermLine[]) => void;
  disabled?: boolean;
}) {
  const total = paymentTermsTotal(terms);

  function updateRow(index: number, patch: Partial<PaymentTermLine>) {
    onChange(terms.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeRow(index: number) {
    onChange(terms.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...terms, emptyPaymentTerm()]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-700">Payment terms</p>
          <p className="text-xs text-slate-500">
            Description + percentage. Total must equal 100%.
          </p>
        </div>
        <p
          className={`text-sm font-semibold tabular-nums ${
            Math.abs(total - 100) < 0.01 ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          Total: {total}%
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="hidden grid-cols-[1fr_7rem_2.5rem] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Description</span>
          <span>% </span>
          <span />
        </div>
        <div className="divide-y divide-slate-100">
          {terms.map((term, index) => {
            const isCustom = term.is_custom || term.label === "Custom";
            return (
              <div
                key={index}
                className="grid gap-2 p-3 sm:grid-cols-[1fr_7rem_2.5rem] sm:items-start"
              >
                <div className="space-y-2">
                  <select
                    value={
                      PAYMENT_TERM_PRESETS.includes(
                        term.label as (typeof PAYMENT_TERM_PRESETS)[number]
                      ) && !term.is_custom
                        ? term.label
                        : "Custom"
                    }
                    onChange={(e) => {
                      const preset = e.target.value;
                      if (preset === "Custom") {
                        updateRow(index, {
                          label: term.is_custom ? term.label : "",
                          is_custom: true,
                        });
                      } else {
                        updateRow(index, { label: preset, is_custom: false });
                      }
                    }}
                    className="input-field py-2 text-sm"
                    disabled={disabled}
                  >
                    {PAYMENT_TERM_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {isCustom && (
                    <input
                      type="text"
                      value={term.label === "Custom" ? "" : term.label}
                      onChange={(e) =>
                        updateRow(index, { label: e.target.value, is_custom: true })
                      }
                      className="input-field py-2 text-sm"
                      placeholder="Custom payment description"
                      disabled={disabled}
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 sm:hidden">
                    Percent
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={Number.isFinite(term.percent) ? term.percent : ""}
                    onChange={(e) =>
                      updateRow(index, {
                        percent: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    className="input-field py-2 text-sm tabular-nums"
                    disabled={disabled}
                  />
                </div>
                <div className="flex items-center justify-end sm:pt-1">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={disabled || terms.length <= 1}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    title="Remove term"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={disabled}
        className="btn-secondary gap-1.5 text-sm"
      >
        <Plus className="h-4 w-4" />
        Add payment term
      </button>
    </div>
  );
}
